import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import LandingPage from '@/components/LandingPage';
import ChatInterface from '@/components/ChatInterface';
import AuthPage from '@/components/AuthPage';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [userLanguage, setUserLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session) {
        // Load user's language preference
        loadUserProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        loadUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setUserLanguage(data.preferred_language);
    }
  };

  const handleSignUp = async (language: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          preferred_language: language
        });

      if (error) {
        console.error('Error creating profile:', error);
        toast({
          title: "Error",
          description: "Failed to save language preference",
          variant: "destructive",
        });
      } else {
        setUserLanguage(language);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowChat(false);
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onLanguageSelect={handleSignUp} />;
  }

  return showChat ? (
    <ChatInterface 
      onBack={() => setShowChat(false)} 
      userLanguage={userLanguage}
      onSignOut={handleSignOut}
    />
  ) : (
    <LandingPage onGetStarted={() => setShowChat(true)} />
  );
};

export default Index;
