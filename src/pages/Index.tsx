import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import LandingPage from '@/components/LandingPage';
import ChatInterface from '@/components/ChatInterface';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const navigate = useNavigate();
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
        loadUserProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        // User signed out, redirect to login
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowChat(false);
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
    navigate('/login');
  };

  const handleGetStarted = () => {
    if (!session) {
      navigate('/login');
    } else {
      setShowChat(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-foreground text-xl font-medium">Loading...</div>
      </div>
    );
  }

  // If not logged in, show landing page which will redirect to login on "Get Started"
  if (!session) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // If logged in, show either chat or landing page based on state
  return showChat ? (
    <ChatInterface 
      onBack={() => setShowChat(false)} 
      userLanguage={userLanguage}
      onSignOut={handleSignOut}
    />
  ) : (
    <LandingPage onGetStarted={handleGetStarted} />
  );
};

export default Index;
