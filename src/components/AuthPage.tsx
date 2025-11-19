import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'lug', label: 'Luganda' },
  { value: 'ach', label: 'Acholi' },
  { value: 'teo', label: 'Ateso' },
  { value: 'lgg', label: 'Lugbara' },
  { value: 'nyn', label: 'Runyankole' },
];

export default function AuthPage({ onLanguageSelect }: { onLanguageSelect?: (lang: string) => void }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    onLanguageSelect?.(value);
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-card/95 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">UM-SAFE</h1>
          <p className="text-muted-foreground">Uganda Migrant Safe Migration Assistant</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Preferred Language / Olulimi</Label>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
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

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(215 85% 55%)',
                  brandAccent: 'hsl(215 75% 45%)',
                },
              },
            },
          }}
          providers={[]}
          redirectTo={window.location.origin}
          onlyThirdPartyProviders={false}
          view="sign_in"
          showLinks={true}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign In',
                link_text: "Don't have an account? Sign up",
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: `Sign Up (${LANGUAGES.find(l => l.value === selectedLanguage)?.label})`,
                link_text: 'Already have an account? Sign in',
              },
            },
          }}
        />
      </Card>
    </div>
  );
}
