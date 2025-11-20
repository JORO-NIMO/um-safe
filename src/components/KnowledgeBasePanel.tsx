import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, MapPin, Clock, Mail, Shield, AlertTriangle, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Embassy {
  id: string;
  country: string;
  embassy_name: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  emergency_hotline?: string;
  working_hours?: string;
}

interface Recruiter {
  id: string;
  company_name: string;
  license_number?: string;
  status: string;
  expiry_date?: string;
  countries_of_operation?: string[];
  complaints_count: number;
}

interface Resource {
  id: string;
  category: string;
  title: string;
  content: string;
  priority: number;
}

export default function KnowledgeBasePanel() {
  const [embassies, setEmbassies] = useState<Embassy[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    setLoading(true);
    
    const [embassyData, recruiterData, resourceData] = await Promise.all([
      supabase.from('embassy_contacts').select('*').order('country'),
      supabase.from('recruiters').select('*').eq('status', 'active').order('company_name'),
      supabase.from('rights_resources').select('*').order('priority', { ascending: false })
    ]);

    if (embassyData.data) setEmbassies(embassyData.data);
    if (recruiterData.data) setRecruiters(recruiterData.data);
    if (resourceData.data) setResources(resourceData.data);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading knowledge base...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        Knowledge Base
      </h2>

      <Tabs defaultValue="embassies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="embassies">
            Embassies ({embassies.length})
          </TabsTrigger>
          <TabsTrigger value="recruiters">
            Recruiters ({recruiters.length})
          </TabsTrigger>
          <TabsTrigger value="resources">
            Resources ({resources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="embassies">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {embassies.map((embassy) => (
                <Card key={embassy.id} className="p-4 border-l-4 border-l-primary">
                  <h3 className="font-bold text-lg mb-2">{embassy.country}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{embassy.embassy_name}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-medium">Primary:</span>
                      <a href={`tel:${embassy.phone_primary}`} className="text-primary hover:underline">
                        {embassy.phone_primary}
                      </a>
                    </div>
                    
                    {embassy.emergency_hotline && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Emergency:</span>
                        <a href={`tel:${embassy.emergency_hotline}`} className="text-red-500 hover:underline font-bold">
                          {embassy.emergency_hotline}
                        </a>
                      </div>
                    )}
                    
                    {embassy.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${embassy.email}`} className="text-primary hover:underline">
                          {embassy.email}
                        </a>
                      </div>
                    )}
                    
                    {embassy.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{embassy.address}</span>
                      </div>
                    )}
                    
                    {embassy.working_hours && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{embassy.working_hours}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recruiters">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {recruiters.map((recruiter) => (
                <Card key={recruiter.id} className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{recruiter.company_name}</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {recruiter.license_number && (
                      <div>
                        <span className="font-medium">License:</span> {recruiter.license_number}
                      </div>
                    )}
                    
                    {recruiter.expiry_date && (
                      <div>
                        <span className="font-medium">Valid Until:</span>{' '}
                        {new Date(recruiter.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                    
                    {recruiter.countries_of_operation && recruiter.countries_of_operation.length > 0 && (
                      <div>
                        <span className="font-medium">Countries:</span>{' '}
                        {recruiter.countries_of_operation.join(', ')}
                      </div>
                    )}
                    
                    {recruiter.complaints_count > 0 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">{recruiter.complaints_count} complaint(s) on record</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="resources">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {resources.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{resource.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {resource.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {resource.content}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
