import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Phone, Mail, Globe, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Recruiter {
  id: string;
  company_name: string;
  license_number: string | null;
  status: string;
  company_address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  countries_of_operation: string[] | null;
  complaints_count: number;
}

export default function RecruitersList() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const { data, error } = await supabase
        .from("recruiters")
        .select("*")
        .order("company_name");

      if (error) throw error;
      setRecruiters(data || []);
    } catch (error) {
      console.error("Error fetching recruiters:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecruiters = recruiters.filter((recruiter) =>
    recruiter.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recruiter.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Verified Recruiters</h1>
          <p className="text-muted-foreground">
            Check the status and details of licensed recruitment agencies.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecruiters.map((recruiter) => (
            <Card key={recruiter.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {recruiter.company_name}
                  </CardTitle>
                  {recruiter.status === "active" ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {recruiter.status}
                    </Badge>
                  )}
                </div>
                {recruiter.license_number && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Lic: {recruiter.license_number}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {recruiter.company_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{recruiter.company_address}</span>
                  </div>
                )}
                {recruiter.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${recruiter.phone}`} className="hover:underline">
                      {recruiter.phone}
                    </a>
                  </div>
                )}
                {recruiter.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${recruiter.email}`} className="hover:underline truncate">
                      {recruiter.email}
                    </a>
                  </div>
                )}
                {recruiter.countries_of_operation && recruiter.countries_of_operation.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{recruiter.countries_of_operation.join(", ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
