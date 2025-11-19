import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en' } = await req.json();
    console.log('Received messages:', messages.length, 'Language:', language);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUNBIRD_API_KEY = Deno.env.get("SUNBIRD_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUNBIRD_API_KEY) throw new Error("SUNBIRD_API_KEY not configured");

    // Get user's preferred language from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('user_id', user.id)
      .maybeSingle();

    const userLanguage = profile?.preferred_language || language;
    console.log('User language:', userLanguage);

    // Translate user's last message if not in English
    let translatedMessages = [...messages];
    if (userLanguage !== 'en' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        console.log('Translating user message from', userLanguage, 'to English');
        const translationResponse = await fetch('https://api.sunbird.ai/tasks/nmt_translate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUNBIRD_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_language: userLanguage,
            target_language: 'en',
            text: lastMessage.content
          })
        });

        if (translationResponse.ok) {
          const translationData = await translationResponse.json();
          console.log('Translation result:', translationData);
          translatedMessages[translatedMessages.length - 1] = {
            ...lastMessage,
            content: translationData.output || lastMessage.content
          };
        }
      }
    }

    // Get AI response
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are UM-SAFE (Uganda Migrant Safe Migration Assistant), an AI assistant helping Ugandan migrant workers traveling to the Middle East. You provide information about: recruiter verification, workers' rights education, emergency SOS procedures, embassy contacts, and reintegration support. Be helpful, compassionate, and provide accurate information to protect migrant workers.`
          },
          ...translatedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    // If user wants response in non-English, we'll need to translate the response
    // For streaming, we'll collect the full response first, then translate and stream
    if (userLanguage !== 'en') {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      console.log('Translating response from English to', userLanguage);
      // Translate the full response
      const translationResponse = await fetch('https://api.sunbird.ai/tasks/nmt_translate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUNBIRD_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_language: 'en',
          target_language: userLanguage,
          text: fullResponse
        })
      });

      let translatedResponse = fullResponse;
      if (translationResponse.ok) {
        const translationData = await translationResponse.json();
        console.log('Translated response:', translationData);
        translatedResponse = translationData.output || fullResponse;
      }

      // Save to database
      await supabase.from('chat_messages').insert([
        { user_id: user.id, role: 'user', content: messages[messages.length - 1].content, language: userLanguage },
        { user_id: user.id, role: 'assistant', content: translatedResponse, language: userLanguage }
      ]);

      // Stream the translated response
      const stream = new ReadableStream({
        start(controller) {
          const words = translatedResponse.split(' ');
          let index = 0;
          
          const interval = setInterval(() => {
            if (index < words.length) {
              const chunk = `data: ${JSON.stringify({
                choices: [{
                  delta: { content: words[index] + ' ' }
                }]
              })}\n\n`;
              controller.enqueue(new TextEncoder().encode(chunk));
              index++;
            } else {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              clearInterval(interval);
            }
          }, 50);
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // For English, just pass through the stream
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
