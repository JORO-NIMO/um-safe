import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Check } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    'Recruiter verification',
    'Rights education',
    'Emergency SOS alerts',
    'Embassy contacts',
    'Reintegration support'
  ];

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-card/80 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">UM-SAFE</h1>
          <p className="text-lg text-muted-foreground">
            Uganda Migrant Safe Migration Assistant
          </p>
          <p className="text-sm text-muted-foreground italic">
            Omuyambi wo mu Safari
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-center text-foreground">
            Protecting Ugandan migrant workers traveling to the Middle East through:
          </p>
          
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-foreground">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button 
          onClick={onGetStarted}
          className="w-full"
          size="lg"
        >
          Get Started / Tandika
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  );
}
