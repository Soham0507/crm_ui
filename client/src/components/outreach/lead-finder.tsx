import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Users, 
  Download, 
  Upload, 
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building,
  MapPin,
  Mail,
  Linkedin,
  Plus
} from "lucide-react";
import type { ICPProfile, Lead, LeadList, LeadData } from "@shared/schema";

interface LeadFinderProps {
  icpId: number | null;
  onLeadsFound: (listId: number) => void;
}

export default function LeadFinder({ icpId, onLeadsFound }: LeadFinderProps) {
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [listName, setListName] = useState("");
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch ICP Profile
  const { data: icpProfile } = useQuery<ICPProfile>({
    queryKey: [`/api/icp-profiles/${icpId}`],
    enabled: !!icpId,
  });

  // Fetch existing lead lists
  const { data: leadLists = [] } = useQuery<LeadList[]>({
    queryKey: ['/api/lead-lists'],
  });

  const [currentListId, setCurrentListId] = useState<number | null>(null);

  // Fetch leads for current list
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: [`/api/lead-lists/${currentListId}/leads`],
    enabled: !!currentListId,
  });

  // Search for leads
  const searchLeadsMutation = useMutation({
    mutationFn: async (params: { icpId: number; provider?: string }) => 
      apiRequest('POST', '/api/leads/search', params),
    onSuccess: (result) => {
      setCurrentListId(result.listId);
      queryClient.invalidateQueries({ queryKey: ['/api/lead-lists'] });
      queryClient.invalidateQueries({ queryKey: [`/api/lead-lists/${result.listId}/leads`] });
      toast({
        title: "Lead Search Complete",
        description: `Found ${result.count} potential leads`,
      });
    }
  });

  // Enrich leads
  const enrichLeadsMutation = useMutation({
    mutationFn: async (params: { leadIds: number[]; fields: string[] }) => 
      apiRequest('POST', '/api/leads/enrich', params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/lead-lists/${currentListId}/leads`] });
      toast({
        title: "Enrichment Complete",
        description: `Enriched ${result.enriched} leads successfully`,
      });
      setEnrichmentProgress(0);
    }
  });

  // Verify emails
  const verifyEmailsMutation = useMutation({
    mutationFn: async (params: { leadIds: number[] }) => 
      apiRequest('POST', '/api/leads/verify', params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/lead-lists/${currentListId}/leads`] });
      toast({
        title: "Verification Complete",
        description: `Verified ${result.verified} email addresses`,
      });
    }
  });

  // Create lead list
  const createListMutation = useMutation({
    mutationFn: async (params: { name: string; icpId: number; leadIds: number[] }) => 
      apiRequest('POST', '/api/lead-lists', params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-lists'] });
      toast({
        title: "List Created",
        description: `Created list "${result.name}" with ${result.leadCount} leads`,
      });
      onLeadsFound(result.id);
    }
  });

  const handleSearch = async () => {
    if (!icpId) return;
    
    setIsSearching(true);
    try {
      await searchLeadsMutation.mutateAsync({ icpId });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to search for leads. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnrichSelected = async () => {
    if (selectedLeads.size === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to enrich",
        variant: "destructive"
      });
      return;
    }

    setIsEnriching(true);
    try {
      await enrichLeadsMutation.mutateAsync({
        leadIds: Array.from(selectedLeads),
        fields: ['email', 'linkedin', 'phone', 'company']
      });
    } catch (error) {
      toast({
        title: "Enrichment Failed",
        description: "Unable to enrich leads. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleVerifyEmails = async () => {
    const leadsToVerify = selectedLeads.size > 0 
      ? Array.from(selectedLeads)
      : leads.map(l => l.id);

    try {
      await verifyEmailsMutation.mutateAsync({ leadIds: leadsToVerify });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to verify emails. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateList = () => {
    if (!listName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for the lead list",
        variant: "destructive"
      });
      return;
    }

    if (selectedLeads.size === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to add to the list",
        variant: "destructive"
      });
      return;
    }

    if (!icpId) return;

    createListMutation.mutate({
      name: listName,
      icpId,
      leadIds: Array.from(selectedLeads)
    });
  };

  const getEmailStatusIcon = (lead: Lead) => {
    const data = lead.data as LeadData;
    if (!data.email) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    
    switch (data.email.status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">High ({score})</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium ({score})</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Low ({score})</Badge>;
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const data = lead.data as LeadData;
    const query = searchQuery.toLowerCase();
    return (
      data.fullName?.toLowerCase().includes(query) ||
      data.company?.name?.toLowerCase().includes(query) ||
      data.title?.toLowerCase().includes(query) ||
      data.email?.value?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lead Discovery
          </CardTitle>
          <CardDescription>
            Find and enrich leads matching your ICP criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {icpProfile && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Searching with ICP: {icpProfile.name}</p>
              <p className="text-xs text-gray-500 mt-1">{icpProfile.narrative}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleSearch}
              disabled={!icpId || isSearching}
              className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search for Leads
                </>
              )}
            </Button>

            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>

            {leads.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="secondary">
                  {filteredLeads.length} leads found
                </Badge>
                {selectedLeads.size > 0 && (
                  <Badge className="bg-requisor-turquoise">
                    {selectedLeads.size} selected
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Enrichment Progress */}
          {isEnriching && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enriching leads...</span>
                <span>{enrichmentProgress}%</span>
              </div>
              <Progress value={enrichmentProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Results Table */}
      {(leads.length > 0 || leadsLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lead Results</CardTitle>
                <CardDescription>Review and select leads for your campaign</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnrichSelected}
                  disabled={selectedLeads.size === 0 || isEnriching}
                >
                  Enrich Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyEmails}
                  disabled={verifyEmailsMutation.isPending}
                >
                  Verify Emails
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
                            } else {
                              setSelectedLeads(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name & Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map(lead => {
                      const data = lead.data as LeadData;
                      return (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.has(lead.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedLeads);
                                if (checked) {
                                  newSelected.add(lead.id);
                                } else {
                                  newSelected.delete(lead.id);
                                }
                                setSelectedLeads(newSelected);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-sm text-gray-500">{data.title}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm">{data.company?.name}</p>
                                <p className="text-xs text-gray-500">{data.company?.industry}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEmailStatusIcon(lead)}
                              <span className="text-sm">
                                {data.email?.value || 'Not found'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{data.geo}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getScoreBadge(data.score || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {data.linkedin && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={data.linkedin} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              {data.email?.value && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={`mailto:${data.email.value}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create List Action */}
      {selectedLeads.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="list-name">List Name</Label>
                <Input
                  id="list-name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g., Q1 2024 Fintech Targets"
                  className="mt-2"
                />
              </div>
              <Button
                onClick={handleCreateList}
                disabled={!listName.trim() || createListMutation.isPending}
                className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create List with {selectedLeads.size} Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}