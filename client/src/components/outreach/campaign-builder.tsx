import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Linkedin, 
  Clock,
  Send,
  Save,
  Plus,
  Settings,
  Sparkles,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import type { Campaign, EmailTemplate, LeadList, CampaignSettings } from "@shared/schema";

interface CampaignBuilderProps {
  icpId: number | null;
  listId: number | null;
}

interface CampaignStep {
  id: string;
  dayOffset: number;
  channel: 'email' | 'linkedin';
  subject?: string;
  body: string;
  conditions?: {
    ifNoReply?: boolean;
    ifNoOpen?: boolean;
  };
}

export default function CampaignBuilder({ icpId, listId }: CampaignBuilderProps) {
  const [campaignName, setCampaignName] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [steps, setSteps] = useState<CampaignStep[]>([
    {
      id: '1',
      dayOffset: 0,
      channel: 'email',
      subject: '',
      body: ''
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [activeStepId, setActiveStepId] = useState('1');
  const [maxPerDay, setMaxPerDay] = useState(50);
  const [sendWindow, setSendWindow] = useState("09:00-17:00");
  const [enableTracking, setEnableTracking] = useState(true);
  const [includeOptOut, setIncludeOptOut] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch lead list
  const { data: leadList } = useQuery<LeadList>({
    queryKey: [`/api/lead-lists/${listId}`],
    enabled: !!listId,
  });

  // Fetch email templates
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
  });

  // Create campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => 
      apiRequest('POST', '/api/campaigns', data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Created",
        description: `Successfully created campaign "${campaignName}"`,
      });
    }
  });

  // Launch campaign
  const launchCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => 
      apiRequest('POST', `/api/campaigns/${campaignId}/launch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Launched",
        description: "Your campaign is now active and sending",
      });
    }
  });

  // Generate with AI
  const generateWithAIMutation = useMutation({
    mutationFn: async (params: { stepId: string; context: any }) => 
      apiRequest('POST', '/api/campaigns/generate-email', params),
    onSuccess: (result, variables) => {
      const updatedSteps = steps.map(step => 
        step.id === variables.stepId
          ? { ...step, subject: result.subject, body: result.body }
          : step
      );
      setSteps(updatedSteps);
      toast({
        title: "Email Generated",
        description: "AI has created an email for this step",
      });
    }
  });

  const activeStep = steps.find(s => s.id === activeStepId);

  const handleAddStep = () => {
    const lastStep = steps[steps.length - 1];
    const newStep: CampaignStep = {
      id: String(steps.length + 1),
      dayOffset: lastStep ? lastStep.dayOffset + 3 : 0,
      channel: 'email',
      subject: '',
      body: ''
    };
    setSteps([...steps, newStep]);
    setActiveStepId(newStep.id);
  };

  const handleRemoveStep = (stepId: string) => {
    if (steps.length === 1) return;
    const filtered = steps.filter(s => s.id !== stepId);
    setSteps(filtered);
    if (activeStepId === stepId) {
      setActiveStepId(filtered[0].id);
    }
  };

  const handleUpdateStep = (stepId: string, updates: Partial<CampaignStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const handleGenerateEmail = async () => {
    if (!activeStep) return;
    
    await generateWithAIMutation.mutateAsync({
      stepId: activeStep.id,
      context: {
        icpId,
        stepNumber: steps.findIndex(s => s.id === activeStep.id) + 1,
        isFollowUp: activeStep.dayOffset > 0
      }
    });
  };

  const handleSaveCampaign = async () => {
    if (!campaignName.trim() || !fromName.trim() || !fromEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const settings: CampaignSettings = {
      from: {
        name: fromName,
        email: fromEmail
      },
      limits: {
        maxPerDay,
        window: sendWindow,
        timezone: 'America/New_York'
      },
      tracking: enableTracking,
      optOutFooter: includeOptOut
    };

    await createCampaignMutation.mutateAsync({
      name: campaignName,
      icpId,
      listId,
      settings,
      steps
    });
  };

  const handleLaunchCampaign = async () => {
    // First save, then launch
    await handleSaveCampaign();
    // Would get the campaign ID from the save response
    // await launchCampaignMutation.mutateAsync(campaignId);
  };

  const handleLoadTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !activeStep) return;
    
    handleUpdateStep(activeStep.id, {
      subject: template.subject,
      body: template.body
    });
  };

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campaign Builder
          </CardTitle>
          <CardDescription>
            Create multi-step email and LinkedIn outreach campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Q1 2024 Fintech Outreach"
                className="mt-2"
              />
            </div>
            {leadList && (
              <div>
                <Label>Target List</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{leadList.name}</p>
                  <p className="text-sm text-gray-500">Contains leads for this campaign</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from-name">From Name *</Label>
              <Input
                id="from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Name"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="from-email">From Email *</Label>
              <Input
                id="from-email"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Sequence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Sequence</CardTitle>
              <CardDescription>Design your multi-step outreach flow</CardDescription>
            </div>
            <Button onClick={handleAddStep} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step Timeline */}
          <div className="flex items-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setActiveStepId(step.id)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                    activeStepId === step.id 
                      ? 'bg-white shadow-sm ring-2 ring-requisor-turquoise' 
                      : 'hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {step.channel === 'email' ? (
                      <Mail className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Linkedin className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm font-medium">Step {index + 1}</span>
                  </div>
                  <span className="text-xs text-gray-500">Day {step.dayOffset}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-300 mx-1" />
                )}
              </div>
            ))}
          </div>

          {/* Step Editor */}
          {activeStep && (
            <Tabs defaultValue="compose" className="space-y-4">
              <TabsList>
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="compose" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Select 
                      value={activeStep.channel}
                      onValueChange={(v) => handleUpdateStep(activeStep.id, { channel: v as 'email' | 'linkedin' })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Day</span>
                      <Input
                        type="number"
                        value={activeStep.dayOffset}
                        onChange={(e) => handleUpdateStep(activeStep.id, { dayOffset: parseInt(e.target.value) || 0 })}
                        className="w-16"
                        min="0"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateEmail}
                    variant="outline"
                    size="sm"
                    disabled={generateWithAIMutation.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>

                {activeStep.channel === 'email' && (
                  <div>
                    <Label htmlFor={`subject-${activeStep.id}`}>Subject Line</Label>
                    <Input
                      id={`subject-${activeStep.id}`}
                      value={activeStep.subject || ''}
                      onChange={(e) => handleUpdateStep(activeStep.id, { subject: e.target.value })}
                      placeholder="Enter email subject..."
                      className="mt-2"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`body-${activeStep.id}`}>
                    {activeStep.channel === 'email' ? 'Email Body' : 'Message'}
                  </Label>
                  <Textarea
                    id={`body-${activeStep.id}`}
                    value={activeStep.body}
                    onChange={(e) => handleUpdateStep(activeStep.id, { body: e.target.value })}
                    placeholder={activeStep.channel === 'email' 
                      ? "Write your email content...\n\nUse variables like {{firstName}}, {{company}}, {{title}}" 
                      : "Write your LinkedIn message..."}
                    className="mt-2 min-h-[200px] font-mono text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline">{{firstName}}</Badge>
                    <Badge variant="outline">{{company}}</Badge>
                    <Badge variant="outline">{{title}}</Badge>
                    <Badge variant="outline">{{industry}}</Badge>
                  </div>
                </div>

                {activeStep.dayOffset > 0 && (
                  <div className="space-y-2">
                    <Label>Conditions</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={activeStep.conditions?.ifNoReply || false}
                          onChange={(e) => handleUpdateStep(activeStep.id, {
                            conditions: { ...activeStep.conditions, ifNoReply: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Only send if no reply to previous step</span>
                      </label>
                    </div>
                  </div>
                )}

                {steps.length > 1 && (
                  <Button
                    onClick={() => handleRemoveStep(activeStep.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove This Step
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <div className="grid gap-4">
                  {templates.map(template => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleLoadTemplate(template.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{template.body}</p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No templates available yet
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-per-day">Max Sends Per Day</Label>
                    <Input
                      id="max-per-day"
                      type="number"
                      value={maxPerDay}
                      onChange={(e) => setMaxPerDay(parseInt(e.target.value) || 50)}
                      className="mt-2 w-32"
                      min="1"
                      max="500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Limit daily sends to avoid spam filters</p>
                  </div>

                  <div>
                    <Label htmlFor="send-window">Send Time Window</Label>
                    <Input
                      id="send-window"
                      value={sendWindow}
                      onChange={(e) => setSendWindow(e.target.value)}
                      placeholder="09:00-17:00"
                      className="mt-2 w-32"
                    />
                    <p className="text-xs text-gray-500 mt-1">Time range for sending (recipient's timezone)</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Tracking</Label>
                      <p className="text-xs text-gray-500">Track opens and clicks</p>
                    </div>
                    <Switch
                      checked={enableTracking}
                      onCheckedChange={setEnableTracking}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Opt-Out Footer</Label>
                      <p className="text-xs text-gray-500">Required for compliance</p>
                    </div>
                    <Switch
                      checked={includeOptOut}
                      onCheckedChange={setIncludeOptOut}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="h-4 w-4" />
          Campaigns will respect unsubscribe preferences and sending limits
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveCampaign}
            disabled={createCampaignMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handleLaunchCampaign}
            disabled={createCampaignMutation.isPending || launchCampaignMutation.isPending}
            className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
          >
            <Send className="h-4 w-4 mr-2" />
            Launch Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}