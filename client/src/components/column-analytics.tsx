import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Tag,
  Building
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contact } from "@shared/schema";

interface ColumnAnalyticsProps {
  contacts: Contact[];
  isVisible: boolean;
  onToggle: () => void;
}

export default function ColumnAnalytics({ contacts, isVisible, onToggle }: ColumnAnalyticsProps) {
  const analytics = useMemo(() => {
    if (contacts.length === 0) return null;

    // Pipeline Analytics
    const pipelineStats = {
      lead: contacts.filter(c => c.status === 'lead').length,
      qualified: contacts.filter(c => c.status === 'qualified').length,
      proposal: contacts.filter(c => c.status === 'proposal').length,
      closedWon: contacts.filter(c => c.status === 'closed-won').length,
      closedLost: contacts.filter(c => c.status === 'closed-lost').length,
    };

    const totalPipeline = pipelineStats.lead + pipelineStats.qualified + pipelineStats.proposal;
    const conversionRate = totalPipeline > 0 ? (pipelineStats.closedWon / (pipelineStats.closedWon + pipelineStats.closedLost)) * 100 : 0;

    // Deal Value Analytics
    const dealValues = contacts.map(c => c.dealValue || 0).filter(v => v > 0);
    const totalValue = dealValues.reduce((sum, val) => sum + val, 0);
    const avgDealValue = dealValues.length > 0 ? totalValue / dealValues.length : 0;
    const maxDealValue = dealValues.length > 0 ? Math.max(...dealValues) : 0;
    const pipelineValue = contacts
      .filter(c => ['lead', 'qualified', 'proposal'].includes(c.status))
      .reduce((sum, c) => sum + (c.dealValue || 0), 0);

    // Tag Analytics
    const allTags = contacts.flatMap(c => c.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Company Analytics
    const companies = contacts.map(c => c.company).filter(Boolean);
    const companyCounts = companies.reduce((acc, company) => {
      acc[company!] = (acc[company!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCompanies = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Contact Quality Score
    const qualityScores = contacts.map(contact => {
      let score = 0;
      if (contact.phone) score += 25;
      if (contact.company) score += 25;
      if (contact.tags && contact.tags.length > 0) score += 25;
      if (contact.dealValue && contact.dealValue > 0) score += 25;
      return score;
    });
    const avgQualityScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

    // Time-based Analytics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentContacts = contacts.filter(c => 
      c.createdAt && new Date(c.createdAt) > last30Days
    ).length;

    return {
      pipeline: pipelineStats,
      totalPipeline,
      conversionRate,
      dealValue: {
        total: totalValue,
        average: avgDealValue,
        max: maxDealValue,
        pipelineValue,
      },
      tags: topTags,
      companies: topCompanies,
      qualityScore: avgQualityScore,
      recentContacts,
      totalContacts: contacts.length,
    };
  }, [contacts]);

  if (!analytics || !isVisible) return null;

  return (
    <div className="bg-white border-t border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
        <button
          onClick={onToggle}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Hide Analytics
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Pipeline Value */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-green-600" />
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.dealValue.pipelineValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {formatCurrency(analytics.dealValue.total)}
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-1 text-blue-600" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.conversionRate.toFixed(1)}%
            </div>
            <div className="mt-2">
              <Progress value={analytics.conversionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Average Deal Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-purple-600" />
              Avg Deal Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(analytics.dealValue.average)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max: {formatCurrency(analytics.dealValue.max)}
            </p>
          </CardContent>
        </Card>

        {/* Contact Quality */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-1 text-orange-600" />
              Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.qualityScore.toFixed(0)}%
            </div>
            <div className="mt-2">
              <Progress value={analytics.qualityScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-indigo-600" />
              Recent Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {analytics.recentContacts}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Pipeline Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-emerald-600" />
              Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Leads</span>
                <span>{analytics.pipeline.lead}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Qualified</span>
                <span>{analytics.pipeline.qualified}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Proposals</span>
                <span>{analytics.pipeline.proposal}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              Most Used Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.tags.map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">{tag}</Badge>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
              {analytics.tags.length === 0 && (
                <p className="text-sm text-gray-500">No tags found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Building className="h-4 w-4 mr-1" />
              Top Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.companies.map(([company, count]) => (
                <div key={company} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{company}</span>
                  <Badge variant="outline" className="text-xs">{count}</Badge>
                </div>
              ))}
              {analytics.companies.length === 0 && (
                <p className="text-sm text-gray-500">No companies found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}