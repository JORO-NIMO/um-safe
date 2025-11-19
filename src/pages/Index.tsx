import { useState } from 'react';
import LandingPage from '@/components/LandingPage';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  const [showChat, setShowChat] = useState(false);

  return showChat ? (
    <ChatInterface onBack={() => setShowChat(false)} />
  ) : (
    <LandingPage onGetStarted={() => setShowChat(true)} />
  );
};

export default Index;
