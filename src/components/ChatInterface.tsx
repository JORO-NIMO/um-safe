import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, LogOut, Settings, MessageSquare, Shield, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import KnowledgeBasePanel from '@/components/KnowledgeBasePanel';
import { translateWithMeta, translateText } from '@/lib/translation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
  userLanguage: string;
  onSignOut: () => void;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'lug', label: 'Luganda' },
  { value: 'ach', label: 'Acholi' },
  { value: 'teo', label: 'Ateso' },
  { value: 'lgg', label: 'Lugbara' },
  { value: 'nyn', label: 'Runyankole' },
];

export default function ChatInterface({ onBack, userLanguage, onSignOut }: ChatInterfaceProps) {
  const initialEnglishGreeting = '👋 Hello! I am UM-SAFE, your safe migration assistant. I can help you with:\n\n✓ Recruiter verification\n✓ Understanding your rights\n✓ Emergency contacts\n✓ Travel safety tips\n\nHow can I assist you today?';
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: initialEnglishGreeting
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(userLanguage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
    translateInitialGreeting();
  }, []);

  const [noticeShown, setNoticeShown] = useState(false);

  const translateInitialGreeting = async () => {
    if (language !== 'en') {
      try {
        const meta = await translateWithMeta(initialEnglishGreeting, language);
        setMessages(prev => prev.map((m, i) => i === 0 ? { ...m, content: meta.text } : m));
        if (!meta.translated && !noticeShown) {
          toast({
            title: 'Translation Unavailable',
            description: 'This language is not yet supported. Showing English for now.',
          });
          setNoticeShown(true);
        }
      } catch (e) {
        console.warn('Initial greeting translation failed.', e);
      }
    }
  };

  const loadChatHistory = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error loading chat history:', error);
      return;
    }

    if (data && data.length > 0) {
      const historicalMessages = data.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      setMessages([...historicalMessages]);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, preferred_language: newLang });
      
      if (error) {
        console.error('Error updating language:', error);
        toast({
          title: "Error",
          description: "Failed to update language preference",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Language Updated ✓",
          description: `Language changed to ${LANGUAGES.find(l => l.value === newLang)?.label}`,
        });
      }
    }
  };

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }
    
    // Translate outbound user message to English if needed (backend assumed English-centric)
    let internalUserMessage = userMessage;
    if (language !== 'en') {
      try {
        const metaOut = await translateWithMeta(userMessage, 'en');
        internalUserMessage = metaOut.text || userMessage;
        if (!metaOut.translated && !noticeShown) {
          toast({
            title: 'Translation Unavailable',
            description: 'Cannot translate outgoing message. Sending original language.',
          });
          setNoticeShown(true);
        }
      } catch { /* fallback to original */ }
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ 
        messages: [...messages, { role: 'user', content: internalUserMessage }],
        language
      }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429 || resp.status === 402) {
        const error = await resp.json();
        throw new Error(error.error);
      }
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && prev.length > 1) {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Post-translation step (only once stream finishes)
    if (assistantContent && language !== 'en') {
      try {
        const metaIn = await translateWithMeta(assistantContent, language);
        if (metaIn.translated) {
          setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: metaIn.text } : m));
        } else if (!noticeShown) {
          toast({
            title: 'Translation Unavailable',
            description: 'Assistant response shown in English due to limited language support.',
          });
          setNoticeShown(true);
        }
      } catch (e) {
        console.warn('Translation failed, showing original content.', e);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      await streamChat(userMsg);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again or contact support if the issue persists.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <div className="bg-card/90 backdrop-blur-md border-b border-border shadow-md">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-foreground hover:bg-card hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  UM-SAFE Assistant
                  <Badge variant="secondary" className="text-xs">AI</Badge>
                </h1>
                <p className="text-sm text-muted-foreground">Omuyambi wo mu Safari</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:scale-105 transition-transform" title="Knowledge Base">
                  <BookOpen className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-2xl">
                <SheetHeader>
                  <SheetTitle>Knowledge Base</SheetTitle>
                  <SheetDescription>
                    Embassy contacts, verified recruiters, and safety resources
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <KnowledgeBasePanel />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:scale-105 transition-transform">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                  <SheetDescription>
                    Customize your preferences
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="language-setting">Language / Olulimi</Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger id="language-setting">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              title="Sign Out"
              className="hover:scale-105 transition-transform hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="container max-w-4xl mx-auto space-y-4 pb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground border border-border'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">UM-SAFE Assistant</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card text-card-foreground border border-border rounded-2xl px-4 py-3 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="bg-card/90 backdrop-blur-md border-t border-border shadow-lg p-4">
        <div className="container max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your message... (Press Enter to send)"
              disabled={isLoading}
              className="bg-background border-2 focus:border-primary transition-colors"
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="px-6 hover:scale-105 transition-transform"
              size="lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
