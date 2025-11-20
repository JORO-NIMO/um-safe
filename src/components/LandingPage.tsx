import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Shield, Globe, AlertCircle, Phone, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const navigate = useNavigate();
  const features = [
    { icon: Shield, text: 'Recruiter verification', color: 'text-blue-500', action: () => navigate('/recruiters') },
    { icon: AlertCircle, text: 'Rights education', color: 'text-green-500' },
    { icon: Phone, text: 'Emergency SOS alerts', color: 'text-red-500' },
    { icon: Globe, text: 'Embassy contacts', color: 'text-purple-500' },
    { icon: Home, text: 'Reintegration support', color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 md:p-10 space-y-8 bg-card/90 backdrop-blur-sm shadow-2xl border-2">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              Powered by AI • Bilingual Support
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            UM-SAFE
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-foreground">
            Uganda Migrant Safe Migration Assistant
          </p>
          <p className="text-lg text-muted-foreground italic">
            Omuyambi wo mu Safari • Your Journey Companion
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-center text-foreground font-medium">
              Empowering Ugandan migrant workers traveling to the Middle East with:
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.text}
                  onClick={feature.action}
                  className={`flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border hover:bg-background/80 transition-colors ${feature.action ? 'cursor-pointer hover:border-primary/50' : ''}`}
                >
                  <div className={`${feature.color} mt-0.5`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-foreground font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">Available in 6 local languages</p>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">24/7 AI-powered assistance</p>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">Free & confidential support</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onGetStarted}
            className="w-full text-lg h-12 shadow-lg hover:shadow-xl transition-shadow"
            size="lg"
          >
            Get Started / Tandika
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{' '}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
