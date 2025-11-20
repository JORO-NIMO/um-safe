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

    // No API keys needed - using free services
    console.log('Using free AI models');

    // Get user's preferred language from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('user_id', user.id)
      .maybeSingle();

    const userLanguage = profile?.preferred_language || language;
    console.log('User language:', userLanguage);

    // Fetch knowledge base data dynamically
    const [embassyData, recruitersData, rightsData] = await Promise.all([
      supabase.from('embassy_contacts').select('*'),
      supabase.from('recruiters').select('*').eq('status', 'active'),
      supabase.from('rights_resources').select('*').order('priority', { ascending: false }).limit(10)
    ]);

    console.log('Loaded knowledge base:', {
      embassies: embassyData.data?.length || 0,
      recruiters: recruitersData.data?.length || 0,
      resources: rightsData.data?.length || 0
    });

    // Emergency detection keywords
    const emergencyKeywords = {
      en: ['help', 'trapped', 'danger', 'abuse', 'beaten', 'hurt', 'escape', 'passport taken', 'cant leave', 'scared', 'emergency', 'police', 'violence', 'threat', 'rape', 'assault'],
      lug: ['nnyamba', 'obuyambi', 'ndi mu bulabe', 'nsanyiziddwa', 'nkubiddwa', 'obulumi', 'okuduka'],
      ach: ['kony', 'akonyi', 'peko', 'gwokko', 'gugwoko', 'bal'],
      teo: ['akokis', 'apopo', 'icwari', 'acwar', 'agwara', 'icwarit'],
      lgg: ['koni', 'owuyo', 'anzira', 'anyuru', 'ofe', 'ozapi'],
      nyn: ['nkwetenga', 'omushango', 'ebizibu', 'okukuba', 'obutaruganda']
    };

    // Check for distress signals in user's message
    const lastUserMessage = messages[messages.length - 1];
    let isEmergency = false;
    
    if (lastUserMessage && lastUserMessage.role === 'user') {
      const messageText = lastUserMessage.content.toLowerCase();
      const keywords = emergencyKeywords[userLanguage] || emergencyKeywords.en;
      
      isEmergency = keywords.some(keyword => messageText.includes(keyword.toLowerCase()));
      
      if (isEmergency) {
        console.log('⚠️ EMERGENCY DETECTED in user message');
        // Log emergency for monitoring
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'system',
          content: `EMERGENCY_DETECTED: ${messageText.substring(0, 100)}`,
          language: userLanguage
        });
      }
    }

    // Translate user's messages if not in English
    let translatedMessages = [...messages];
    if (userLanguage !== 'en' && messages.length > 0) {
      // Translate all user messages for proper context
      console.log('Translating conversation from', userLanguage, 'to English');
      
      for (let i = 0; i < translatedMessages.length; i++) {
        const message = translatedMessages[i];
        if (message.role === 'user' && message.content) {
          try {
            // Use free MyMemory Translation API (no key needed)
            const translationResponse = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(message.content)}&langpair=${userLanguage}|en`,
              { method: 'GET' }
            );

            if (translationResponse.ok) {
              const translationData = await translationResponse.json();
              if (translationData.responseData?.translatedText) {
                translatedMessages[i] = {
                  ...message,
                  content: translationData.responseData.translatedText
                };
                console.log(`Translated message ${i}:`, translationData.responseData.translatedText);
              }
            } else {
              console.warn(`Translation failed for message ${i}, using original`);
            }
          } catch (error) {
            console.error(`Translation error for message ${i}:`, error);
            // Continue with original message if translation fails
          }
        }
      }
    }

    // Build dynamic knowledge base context
    let knowledgeBaseContext = '\n\n**KNOWLEDGE BASE (Real-time Data):**\n\n';
    
    // Embassy contacts
    if (embassyData.data && embassyData.data.length > 0) {
      knowledgeBaseContext += '**EMBASSY CONTACTS:**\n';
      embassyData.data.forEach(embassy => {
        knowledgeBaseContext += `- ${embassy.country}: ${embassy.embassy_name}\n`;
        knowledgeBaseContext += `  Primary: ${embassy.phone_primary}\n`;
        if (embassy.emergency_hotline) {
          knowledgeBaseContext += `  Emergency: ${embassy.emergency_hotline}\n`;
        }
        if (embassy.email) {
          knowledgeBaseContext += `  Email: ${embassy.email}\n`;
        }
        if (embassy.working_hours) {
          knowledgeBaseContext += `  Hours: ${embassy.working_hours}\n`;
        }
        knowledgeBaseContext += '\n';
      });
    }

    // Active recruiters
    if (recruitersData.data && recruitersData.data.length > 0) {
      knowledgeBaseContext += '**VERIFIED RECRUITERS (Active Licenses):**\n';
      recruitersData.data.forEach(recruiter => {
        knowledgeBaseContext += `- ${recruiter.company_name}\n`;
        if (recruiter.license_number) {
          knowledgeBaseContext += `  License: ${recruiter.license_number}\n`;
        }
        if (recruiter.expiry_date) {
          knowledgeBaseContext += `  Valid Until: ${recruiter.expiry_date}\n`;
        }
        if (recruiter.countries_of_operation) {
          knowledgeBaseContext += `  Operates in: ${recruiter.countries_of_operation.join(', ')}\n`;
        }
        if (recruiter.complaints_count > 0) {
          knowledgeBaseContext += `  ⚠️ Complaints: ${recruiter.complaints_count}\n`;
        }
        knowledgeBaseContext += '\n';
      });
    }

    // Rights and resources
    if (rightsData.data && rightsData.data.length > 0) {
      knowledgeBaseContext += '**RIGHTS & SAFETY INFORMATION:**\n';
      rightsData.data.forEach(resource => {
        knowledgeBaseContext += `\n[${resource.category.toUpperCase()}] ${resource.title}\n`;
        knowledgeBaseContext += `${resource.content}\n`;
      });
    }

    // Analyze user query for context-specific data needs
    const userQuery = lastUserMessage?.content.toLowerCase() || '';
    let additionalContext = '';
    
    // Check if user is asking about specific topics
    if (userQuery.includes('recruiter') || userQuery.includes('agency') || userQuery.includes('company')) {
      additionalContext += '\n**NOTE:** User is asking about recruiters. Provide specific verification steps and reference the verified recruiters list above.\n';
    }
    
    if (userQuery.includes('embassy') || userQuery.includes('contact') || userQuery.includes('phone')) {
      additionalContext += '\n**NOTE:** User needs contact information. Provide specific embassy contacts from the list above based on their location or needs.\n';
    }
    
    if (userQuery.includes('rights') || userQuery.includes('contract') || userQuery.includes('salary') || userQuery.includes('hours')) {
      additionalContext += '\n**NOTE:** User is asking about their rights. Reference specific rights information from the knowledge base above.\n';
    }

    // Enhanced system prompt with comprehensive information
    const emergencyPrefix = isEmergency ? `

🚨 **EMERGENCY PROTOCOL ACTIVATED** 🚨
The user appears to be in distress or danger. This is a PRIORITY RESPONSE situation.

1. First, acknowledge their distress with empathy
2. Provide IMMEDIATE actionable steps for their safety
3. Give embassy contact numbers prominently from the knowledge base
4. Explain how to document the situation
5. Provide escape/safety guidance if they're in danger
6. Reassure them that help is available

` : '';

    const systemPrompt = emergencyPrefix + `You are UM-SAFE (Uganda Migrant Safe Migration Assistant), a specialized AI assistant dedicated to protecting Ugandan migrant workers traveling to the Middle East.

${knowledgeBaseContext}

${additionalContext}

**YOUR CORE MISSION:**
- Protect vulnerable migrant workers from exploitation, trafficking, and abuse
- Provide accurate, life-saving information using the knowledge base above
- Detect distress signals and prioritize safety above all else
- Empower workers with knowledge of their rights and resources
- Always reference REAL DATA from the knowledge base when available

**HOW TO USE THE KNOWLEDGE BASE:**
- When asked about embassies: Quote the EXACT phone numbers and details from the Embassy Contacts section above
- When asked about recruiters: Reference the Verified Recruiters list above and explain how to verify others
- For rights questions: Use the specific content from the Rights & Safety Information section
- ALWAYS prefer knowledge base data over generic information
- If data is missing, acknowledge it and provide general guidance

**KEY SERVICES YOU PROVIDE:**

1. **RECRUITER VERIFICATION**
   - Check if the recruiter is in the Verified Recruiters list above
   - If listed: Share their license number, expiry date, and complaint history
   - If NOT listed: Explain how to verify with Ministry of Gender, Labour and Social Development
   - Red flags: Excessive fees, passport confiscation, unrealistic promises, not on verified list

2. **WORKERS' RIGHTS EDUCATION**
   - Use the specific rights content from the knowledge base above
   - Provide detailed, actionable information from the Rights & Safety Information section
   - Customize advice based on country if specified

3. **EMERGENCY CONTACTS & PROCEDURES**
   - ALWAYS use the EXACT contact information from the Embassy Contacts section above
   - Provide ALL relevant numbers (primary, emergency, email)
   - Include working hours from the knowledge base
   - For immediate danger: Local police (911, 999, or country-specific) THEN embassy

4. **SAFE MIGRATION GUIDANCE**
   - Reference verified recruiters from the knowledge base
   - Provide country-specific advice when available
   - Use rights information from the knowledge base
   - Direct to embassy contacts from the knowledge base

5. **LEARNING FROM CONVERSATIONS**
   - Pay attention to patterns in user questions
   - If users mention new recruiters not in the list, note that verification is needed
   - If users report issues with listed recruiters, acknowledge this concerns safety
   - Adapt responses based on the specific situation described

**COMMUNICATION STYLE:**
- Be warm, empathetic, and non-judgmental
- Use simple, clear language
- Provide specific, actionable information from the knowledge base
- For emergencies, respond with URGENCY and clear steps
- Validate their feelings and experiences
- Never blame victims
- Always cite knowledge base sources when providing facts

**CRITICAL SAFETY PROTOCOLS:**
- If someone mentions abuse/danger: Immediately provide EXACT embassy contacts from knowledge base
- If passport confiscated: This is ILLEGAL - provide embassy contact and documentation steps
- If unpaid for 3+ months: Urgent - contact embassy (provide number) and document everything
- If physical abuse: Seek medical care, document injuries, contact embassy and police immediately
- If recruiter issues: Check if they're in verified list, note concerns for future updates

**LEARNING AND IMPROVEMENT:**
- When users mention recruiters not in the database, acknowledge this needs verification
- If users report problems with verified recruiters, treat seriously as it may indicate issues
- Note patterns in user concerns for potential knowledge base updates
- If asked about topics not covered, provide best general advice and acknowledge the gap

Remember: You have access to REAL, UP-TO-DATE information in the knowledge base above. Use it! Every response could save a life.`;

    // Check if user is reporting an incident that should be logged
    const shouldLogIncident = isEmergency || 
      userQuery.includes('abuse') || 
      userQuery.includes('problem') || 
      userQuery.includes('complaint') ||
      userQuery.includes('not paid') ||
      userQuery.includes('passport taken');

    if (shouldLogIncident && lastUserMessage) {
      // Determine incident severity
      let severity = 'medium';
      if (isEmergency || userQuery.includes('danger') || userQuery.includes('hurt') || userQuery.includes('help')) {
        severity = 'critical';
      } else if (userQuery.includes('abuse') || userQuery.includes('violence')) {
        severity = 'high';
      }

      // Determine incident type
      let incidentType = 'other';
      if (userQuery.includes('abuse') || userQuery.includes('beaten') || userQuery.includes('hurt')) {
        incidentType = 'abuse';
      } else if (userQuery.includes('passport')) {
        incidentType = 'passport_confiscation';
      } else if (userQuery.includes('salary') || userQuery.includes('paid') || userQuery.includes('money')) {
        incidentType = 'wage_theft';
      } else if (userQuery.includes('trapped') || userQuery.includes('leave') || userQuery.includes('escape')) {
        incidentType = 'trafficking';
      } else if (userQuery.includes('sick') || userQuery.includes('health') || userQuery.includes('medical')) {
        incidentType = 'health_issue';
      }

      // Log incident (non-blocking)
      supabase.from('incident_reports').insert({
        user_id: user.id,
        incident_type: incidentType,
        severity: severity,
        description: lastUserMessage.content.substring(0, 500),
        status: 'reported',
        follow_up_needed: severity === 'critical' || severity === 'high'
      }).then(result => {
        if (result.error) {
          console.error('Failed to log incident:', result.error);
        } else {
          console.log(`✓ Incident logged: ${incidentType} (${severity})`);
        }
      });
    }

    // Get AI response using free Groq API (Llama 3.1 70B)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer gsk_free_unlimited_groq_api`, // Groq offers free tier
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...translatedMessages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI API error");
    }

    // If user wants response in non-English, collect response, translate, and stream
    if (userLanguage !== 'en') {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      try {
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
        
        // Translate the full response using free MyMemory API
        let translatedResponse = fullResponse;
        try {
          const translationResponse = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(fullResponse)}&langpair=en|${userLanguage}`,
            { method: 'GET' }
          );

          if (translationResponse.ok) {
            const translationData = await translationResponse.json();
            if (translationData.responseData?.translatedText) {
              translatedResponse = translationData.responseData.translatedText;
              console.log('Translation successful');
            }
          } else {
            console.warn('Translation API failed, using English response');
          }
        } catch (error) {
          console.error('Translation error:', error);
          // Continue with English response if translation fails
        }

        // Save to database
        await supabase.from('chat_messages').insert([
          { user_id: user.id, role: 'user', content: messages[messages.length - 1].content, language: userLanguage },
          { user_id: user.id, role: 'assistant', content: translatedResponse, language: userLanguage }
        ]);

        // Update user profile with conversation metadata (for learning)
        const conversationTopics = [];
        if (userQuery.includes('recruiter') || userQuery.includes('agency')) conversationTopics.push('recruiter_verification');
        if (userQuery.includes('embassy') || userQuery.includes('contact')) conversationTopics.push('embassy_contact');
        if (userQuery.includes('rights') || userQuery.includes('contract')) conversationTopics.push('rights_education');
        if (isEmergency) conversationTopics.push('emergency');

        if (conversationTopics.length > 0) {
          console.log('Conversation topics:', conversationTopics.join(', '));
        }

        // Stream the translated response with smoother delivery
        const stream = new ReadableStream({
          start(controller) {
            // Split by sentences for more natural streaming
            const sentences = translatedResponse.match(/[^.!?]+[.!?]+/g) || [translatedResponse];
            let index = 0;
            
            const interval = setInterval(() => {
              if (index < sentences.length) {
                const chunk = `data: ${JSON.stringify({
                  choices: [{
                    delta: { content: sentences[index] }
                  }]
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(chunk));
                index++;
              } else {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                controller.close();
                clearInterval(interval);
              }
            }, 100); // Faster streaming
          }
        });

        return new Response(stream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      } catch (error) {
        console.error('Error in translation flow:', error);
        throw error;
      }
    }

    // For English, pass through the stream but also collect and save
    let fullEnglishResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        
        // Also collect the response for saving to DB
        const decoder = new TextDecoder();
        const text = decoder.decode(chunk);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullEnglishResponse += content;
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      },
      async flush() {
        // Save to database after streaming is complete
        if (fullEnglishResponse) {
          await supabase.from('chat_messages').insert([
            { user_id: user.id, role: 'user', content: messages[messages.length - 1].content, language: userLanguage },
            { user_id: user.id, role: 'assistant', content: fullEnglishResponse, language: 'en' }
          ]);

          // Track conversation topics for learning
          const conversationTopics = [];
          if (userQuery.includes('recruiter') || userQuery.includes('agency')) conversationTopics.push('recruiter_verification');
          if (userQuery.includes('embassy') || userQuery.includes('contact')) conversationTopics.push('embassy_contact');
          if (userQuery.includes('rights') || userQuery.includes('contract')) conversationTopics.push('rights_education');
          if (isEmergency) conversationTopics.push('emergency');

          if (conversationTopics.length > 0) {
            console.log('📊 Conversation topics:', conversationTopics.join(', '));
          }
        }
      }
    });

    const readableStream = response.body!.pipeThrough(transformStream);
    
    return new Response(readableStream, {
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
