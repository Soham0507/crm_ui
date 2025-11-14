import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Pause,
  Play,
  Settings,
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  Zap,
  Target,
  BarChart,
} from "lucide-react";

interface CampaignSenderProps {
  campaignId?: number;
  leadListId?: number;
}

interface EmailAccount {
  id: number;
  provider: string;
  email: string;
  displayName?: string;
  isActive: boolean;
  isDefault: boolean;
  dailyLimit: number;
  sentToday: number;
}

interface Lead {
  id: number;
  data: {
    fullName: string;
    email: { value: string };
    company?: { name: string };
  };
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  subject: string;
  body: string;
  recipientCount: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  replyCount: number;
}

export function CampaignSender({ campaignId: initialCampaignId, leadListId }: CampaignSenderProps) {
  const [campaignId, setCampaignId] = useState(initialCampaignId);
  const [isConfiguring, setIsConfiguring] = useState(!campaignId);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendDelay, setSendDelay] = useState("30");
  const [dailyLimit, setDailyLimit] = useState("50");
  const [testEmail, setTestEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  // Fetch email accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<EmailAccount[]>({
    queryKey: ['/api/email-accounts'],
  });

  // Fetch leads if we have a list
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: [`/api/lead-lists/${leadListId}/leads`],
    enabled: !!leadListId,
  });

  // Fetch campaign if we have an ID
  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId,
  });

  // Set default account when accounts load
  useEffect(() => {
    const defaultAccount = accounts.find(a => a.isDefault && a.isActive);
    if (defaultAccount && !selectedAccountId) {
      setSelectedAccountId(defaultAccount.id);
    }
  }, [accounts]);

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const selectedAccount = accounts.find(a => a.id === selectedAccountId);
      if (!selectedAccount) throw new Error("No email account selected");

      return apiRequest('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: campaignName,
          leadListId,
          emailAccountId: selectedAccountId,
          subject,
          body,
          status: 'draft',
          settings: {
            sendDelay: parseInt(sendDelay),
            dailyLimit: parseInt(dailyLimit),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          recipientCount: leads.length,
        }),
      });
    },
    onSuccess: (data: Campaign) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      setCampaignId(data.id);  // Capture the created campaign ID
      setIsConfiguring(false);
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create campaign",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Start campaign mutation
  const startCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/campaigns/${id}/start`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}`] });
      toast({
        title: "Campaign started",
        description: "Your email campaign is now active and sending.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start campaign",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Pause campaign mutation
  const pauseCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/campaigns/${id}/pause`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}`] });
      toast({
        title: "Campaign paused",
        description: "Your email campaign has been paused.",
      });
    },
  });

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to: testEmail,
          subject: personalizeContent(subject, previewLead || leads[0]),
          body: personalizeContent(body, previewLead || leads[0]),
          htmlBody: personalizeContent(body, previewLead || leads[0]),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: `Test email sent to ${testEmail}`,
      });
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send test",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const personalizeContent = (content: string, lead: Lead | null) => {
    if (!lead) return content;
    
    let personalized = content;
    const data = lead.data;
    
    // Replace variables
    personalized = personalized.replace(/\{\{firstName\}\}/g, data.fullName.split(' ')[0] || '');
    personalized = personalized.replace(/\{\{fullName\}\}/g, data.fullName || '');
    personalized = personalized.replace(/\{\{company\}\}/g, data.company?.name || '');
    personalized = personalized.replace(/\{\{email\}\}/g, data.email?.value || '');
    
    return personalized;
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const activeAccounts = accounts.filter(a => a.isActive);

  if (accountsLoading || leadsLoading || campaignLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (activeAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No active email accounts found</p>
            <p className="text-sm text-gray-400">
              Please connect and activate an email account first
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConfiguring) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configure Campaign</CardTitle>
          <CardDescription>
            Set up your email campaign settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Q1 2024 Outreach"
            />
          </div>

          {/* Email Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="email-account">Send From</Label>
            <Select
              value={selectedAccountId?.toString()}
              onValueChange={(v) => setSelectedAccountId(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select email account" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{account.email}</span>
                      {account.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-xs text-gray-500">
                Daily limit: {selectedAccount.sentToday}/{selectedAccount.dailyLimit} emails
              </p>
            )}
          </div>

          {/* Email Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Quick question about {{company}}"
              />
              <p className="text-xs text-gray-500">
                Use variables: {`{{firstName}}, {{company}}, {{email}}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi {{firstName}},&#10;&#10;I noticed {{company}} is..."
                rows={10}
              />
            </div>
          </div>

          {/* Sending Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delay">Delay Between Emails (seconds)</Label>
              <Input
                id="delay"
                type="number"
                value={sendDelay}
                onChange={(e) => setSendDelay(e.target.value)}
                min="10"
                max="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Daily Send Limit</Label>
              <Input
                id="daily-limit"
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                min="1"
                max={selectedAccount?.dailyLimit || 500}
              />
            </div>
          </div>

          {/* Preview & Test */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewLead(leads[0]);
                setShowPreview(true);
              }}
              disabled={leads.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Email
            </Button>
            <div className="flex items-center gap-2">
              <Input
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-48"
              />
              <Button
                variant="outline"
                onClick={() => sendTestMutation.mutate()}
                disabled={!testEmail || !subject || !body || sendTestMutation.isPending}
              >
                {sendTestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send Test"
                )}
              </Button>
            </div>
          </div>

          {/* Recipients Summary */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recipients</p>
                <p className="text-sm text-gray-500">
                  {leads.length} leads from your list will receive this campaign
                </p>
              </div>
              <Badge variant="secondary">{leads.length} recipients</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfiguring(false)}
              disabled={createCampaignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createCampaignMutation.mutate()}
              disabled={!campaignName || !subject || !body || !selectedAccountId || createCampaignMutation.isPending}
              className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
            >
              {createCampaignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Campaign dashboard view
  if (campaign) {
    const openRate = campaign.recipientCount > 0 
      ? Math.round((campaign.openCount / campaign.recipientCount) * 100) 
      : 0;
    const clickRate = campaign.openCount > 0 
      ? Math.round((campaign.clickCount / campaign.openCount) * 100) 
      : 0;
    const replyRate = campaign.sentCount > 0 
      ? Math.round((campaign.replyCount / campaign.sentCount) * 100) 
      : 0;

    return (
      <div className="space-y-6">
        {/* Campaign Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{campaign.name}</CardTitle>
                <CardDescription>
                  Campaign tracking and analytics
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    campaign.status === 'active' ? 'default' :
                    campaign.status === 'completed' ? 'secondary' :
                    campaign.status === 'paused' ? 'outline' :
                    'secondary'
                  }
                >
                  {campaign.status}
                </Badge>
                {campaign.status === 'draft' && (
                  <Button
                    onClick={() => startCampaignMutation.mutate(campaign.id)}
                    disabled={startCampaignMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {startCampaignMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Campaign
                  </Button>
                )}
                {campaign.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => pauseCampaignMutation.mutate(campaign.id)}
                    disabled={pauseCampaignMutation.isPending}
                  >
                    {pauseCampaignMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    Pause
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{campaign.recipientCount}</div>
                <p className="text-sm text-gray-500">Recipients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Send className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{campaign.sentCount}</div>
                <p className="text-sm text-gray-500">Sent</p>
                <Progress 
                  value={(campaign.sentCount / campaign.recipientCount) * 100} 
                  className="mt-2" 
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Eye className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{openRate}%</div>
                <p className="text-sm text-gray-500">Open Rate</p>
                <p className="text-xs text-gray-400">{campaign.openCount} opens</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{clickRate}%</div>
                <p className="text-sm text-gray-500">Click Rate</p>
                <p className="text-xs text-gray-400">{campaign.clickCount} clicks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Mail className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{replyRate}%</div>
                <p className="text-sm text-gray-500">Reply Rate</p>
                <p className="text-xs text-gray-400">{campaign.replyCount} replies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Subject</Label>
              <p className="font-medium">{campaign.subject}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Body</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm">{campaign.body}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preview Dialog
  return (
    <>
      {showPreview && previewLead && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
              <DialogDescription>
                Preview how your email will look to {previewLead.data.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">To</Label>
                <p>{previewLead.data.email?.value}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Subject</Label>
                <p className="font-medium">{personalizeContent(subject, previewLead)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Body</Label>
                <div className="border rounded-lg p-4 bg-white">
                  <pre className="whitespace-pre-wrap">{personalizeContent(body, previewLead)}</pre>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}