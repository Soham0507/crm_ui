import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  BarChart3, 
  Mail, 
  Users,
  TrendingUp,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  MoreHorizontal,
  Eye,
  MousePointer,
  Reply
} from "lucide-react";
import type { Campaign, CampaignSettings } from "@shared/schema";

interface CampaignDashboardProps {
  campaigns: Campaign[];
}

interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
}

export default function CampaignDashboard({ campaigns }: CampaignDashboardProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mock stats for now - would come from deliveries table
  const getCampaignStats = (campaignId: number): CampaignStats => {
    // This would be calculated from actual delivery records
    return {
      sent: Math.floor(Math.random() * 100),
      opened: Math.floor(Math.random() * 80),
      clicked: Math.floor(Math.random() * 30),
      replied: Math.floor(Math.random() * 10),
      bounced: Math.floor(Math.random() * 5),
      unsubscribed: Math.floor(Math.random() * 3)
    };
  };

  // Pause/Resume campaign
  const toggleCampaignMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => 
      apiRequest('PATCH', `/api/campaigns/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Updated",
        description: "Campaign status has been changed",
      });
    }
  });

  const handleToggleCampaign = (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    toggleCampaignMutation.mutate({ id: campaign.id, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
  };

  // Overall stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalStats = campaigns.reduce((acc, campaign) => {
    const stats = getCampaignStats(campaign.id);
    return {
      sent: acc.sent + stats.sent,
      opened: acc.opened + stats.opened,
      clicked: acc.clicked + stats.clicked,
      replied: acc.replied + stats.replied
    };
  }, { sent: 0, opened: 0, clicked: 0, replied: 0 });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Campaigns</p>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <div className="mt-4">
              <Badge className="bg-green-100 text-green-800">
                {activeCampaigns} Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Emails Sent</p>
                <p className="text-2xl font-bold">{totalStats.sent}</p>
              </div>
              <Send className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Rate</p>
                <p className="text-2xl font-bold">
                  {calculateRate(totalStats.opened, totalStats.sent)}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-400" />
            </div>
            <Progress 
              value={calculateRate(totalStats.opened, totalStats.sent)} 
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reply Rate</p>
                <p className="text-2xl font-bold">
                  {calculateRate(totalStats.replied, totalStats.sent)}%
                </p>
              </div>
              <Reply className="h-8 w-8 text-purple-400" />
            </div>
            <Progress 
              value={calculateRate(totalStats.replied, totalStats.sent)} 
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Track and manage your outreach campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No campaigns created yet</p>
              <p className="text-sm mt-2">Start by defining an ICP and finding leads</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Sent</TableHead>
                    <TableHead className="text-center">Opened</TableHead>
                    <TableHead className="text-center">Clicked</TableHead>
                    <TableHead className="text-center">Replied</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map(campaign => {
                    const stats = getCampaignStats(campaign.id);
                    const settings = campaign.settings as CampaignSettings;
                    const openRate = calculateRate(stats.opened, stats.sent);
                    const clickRate = calculateRate(stats.clicked, stats.opened);
                    const replyRate = calculateRate(stats.replied, stats.sent);
                    
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-gray-500">
                              From: {settings?.from?.name || 'Unknown'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(campaign.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{stats.sent}</span>
                            <Send className="h-4 w-4 text-gray-400 mt-1" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{stats.opened}</span>
                            <span className="text-xs text-gray-500">{openRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{stats.clicked}</span>
                            <span className="text-xs text-gray-500">{clickRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{stats.replied}</span>
                            <span className="text-xs text-gray-500">{replyRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {replyRate >= 10 ? (
                              <Badge className="bg-green-100 text-green-800">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                High
                              </Badge>
                            ) : replyRate >= 5 ? (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Medium
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Low
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {campaign.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleCampaign(campaign)}
                                disabled={toggleCampaignMutation.isPending}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : campaign.status === 'paused' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleCampaign(campaign)}
                                disabled={toggleCampaignMutation.isPending}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedCampaignId(campaign.id)}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
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

      {/* Campaign Details Modal would go here */}
      {selectedCampaignId && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Delivery Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Recipients</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Bounced</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Unsubscribed</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-4">Recent Activity</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Campaign launched</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>First batch sent</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCampaignId(null)}
              >
                Close Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}