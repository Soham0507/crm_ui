import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import ICPBuilder from "@/components/outreach/icp-builder";
import LeadFinder from "@/components/outreach/lead-finder";
import ICPEmailFinder from "@/components/outreach/icp-email-finder";
import CampaignBuilder from "@/components/outreach/campaign-builder";
import CampaignDashboard from "@/components/outreach/campaign-dashboard";
import EmailComposer from "@/components/outreach/email-composer";
import { EmailAccounts } from "@/components/outreach/email-accounts";
import { useToast } from "@/hooks/use-toast";
import { Target, Users, Mail, BarChart3, Sparkles, Globe, Send } from "lucide-react";
import type { ICPProfile, Campaign } from "@shared/schema";

export default function Outreach() {
  const [activeTab, setActiveTab] = useState("icp");
  const [selectedICPId, setSelectedICPId] = useState<number | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [emailComposerContact, setEmailComposerContact] = useState<{
    id?: number;
    email?: string;
    name?: string;
    company?: string;
  }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch ICPs
  const { data: icpProfiles = [], isLoading: icpLoading, error: icpError } = useQuery<ICPProfile[]>({
    queryKey: ['/api/icp-profiles'],
    retry: 1,
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
    retry: 1,
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalLeadsReached = campaigns.reduce((acc, c) => {
    // This would be calculated from deliveries in a real implementation
    return acc + 0;
  }, 0);

  const handleICPCreated = (icpId: number) => {
    setSelectedICPId(icpId);
    setActiveTab("leads");
    toast({
      title: "ICP Profile Created",
      description: "Now let's find some leads matching your criteria.",
    });
  };

  const handleLeadsFound = (listId: number) => {
    setSelectedListId(listId);
    setActiveTab("campaigns");
    toast({
      title: "Leads Found",
      description: "You can now create a campaign to reach out to these leads.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-requisor-turquoise" />
                Sales Outreach Agent
              </h1>
              <p className="text-gray-500 mt-2">
                AI-powered outreach from ICP to campaigns
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {icpProfiles.length}
                </div>
                <div className="text-sm text-gray-500">ICPs Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {activeCampaigns}
                </div>
                <div className="text-sm text-gray-500">Active Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {totalLeadsReached}
                </div>
                <div className="text-sm text-gray-500">Leads Reached</div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === 'icp' ? 'bg-requisor-turquoise text-white' : 
                selectedICPId ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {selectedICPId ? '✓' : '1'}
              </div>
              <span className={`text-sm font-medium ${
                activeTab === 'icp' ? 'text-gray-900' : 'text-gray-500'
              }`}>Define ICP</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === 'leads' ? 'bg-requisor-turquoise text-white' : 
                selectedListId ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {selectedListId ? '✓' : '2'}
              </div>
              <span className={`text-sm font-medium ${
                activeTab === 'leads' ? 'text-gray-900' : 'text-gray-500'
              }`}>Find Leads</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === 'campaigns' ? 'bg-requisor-turquoise text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className={`text-sm font-medium ${
                activeTab === 'campaigns' ? 'text-gray-900' : 'text-gray-500'
              }`}>Build Campaign</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === 'dashboard' ? 'bg-requisor-turquoise text-white' : 'bg-gray-200'
              }`}>
                4
              </div>
              <span className={`text-sm font-medium ${
                activeTab === 'dashboard' ? 'text-gray-900' : 'text-gray-500'
              }`}>Track Results</span>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="icp" className="gap-2">
              <Target className="h-4 w-4" />
              ICP Builder
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2" disabled={!selectedICPId}>
              <Users className="h-4 w-4" />
              Lead Finder
            </TabsTrigger>
            <TabsTrigger value="email-finder" className="gap-2">
              <Globe className="h-4 w-4" />
              Email Finder
            </TabsTrigger>
            <TabsTrigger value="email-accounts" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Accounts
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2" disabled={!selectedListId}>
              <Mail className="h-4 w-4" />
              Campaign Builder
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="icp" className="mt-6">
            <ICPBuilder 
              onICPCreated={handleICPCreated}
              existingProfiles={icpProfiles}
            />
          </TabsContent>

          <TabsContent value="leads" className="mt-6">
            <LeadFinder 
              icpId={selectedICPId}
              onLeadsFound={handleLeadsFound}
            />
          </TabsContent>

          <TabsContent value="email-finder" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Email Finder</h2>
                  <p className="text-gray-500">Extract contacts from company websites</p>
                </div>
                <Button 
                  onClick={() => setEmailComposerOpen(true)}
                  className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Compose Email
                </Button>
              </div>
              <ICPEmailFinder />
            </div>
          </TabsContent>

          <TabsContent value="email-accounts" className="mt-6">
            <EmailAccounts />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <CampaignBuilder 
              icpId={selectedICPId}
              listId={selectedListId}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <CampaignDashboard campaigns={campaigns} />
          </TabsContent>
        </Tabs>

        {/* Email Composer Dialog */}
        <EmailComposer
          open={emailComposerOpen}
          onOpenChange={setEmailComposerOpen}
          contactId={emailComposerContact.id}
          contactEmail={emailComposerContact.email}
          contactName={emailComposerContact.name}
          companyName={emailComposerContact.company}
        />
      </div>
    </div>
  );
}