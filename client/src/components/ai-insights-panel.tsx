import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsightsPanelProps {
  contactId?: number;
  className?: string;
}

interface ContactInsight {
  score: number;
  category: 'engagement' | 'conversion' | 'upsell' | 'retention' | 'risk';
  title: string;
  description: string;
  actionable: string;
  confidence: number;
}

interface ContactRecommendations {
  nextActions: string[];
  bestContactTime: string;
  communicationStyle: string;
  dealProbability: number;
  insights: ContactInsight[];
}

interface PipelineInsights {
  summary: string;
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}

const categoryIcons = {
  engagement: Target,
  conversion: TrendingUp,
  upsell: Sparkles,
  retention: CheckCircle,
  risk: AlertTriangle,
};

const categoryColors = {
  engagement: "bg-blue-500",
  conversion: "bg-green-500",
  upsell: "bg-purple-500",
  retention: "bg-yellow-500",
  risk: "bg-red-500",
};

export default function AIInsightsPanel({ contactId, className }: AIInsightsPanelProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const { data: contactInsights, isLoading: isLoadingContact } = useQuery({
    queryKey: [`/api/contacts/${contactId}/insights`],
    enabled: !!contactId,
  });

  const { data: pipelineInsights, isLoading: isLoadingPipeline } = useQuery({
    queryKey: ['/api/pipeline/insights'],
    enabled: !contactId,
  });

  const isLoading = isLoadingContact || isLoadingPipeline;
  const insights = contactInsights as ContactRecommendations | undefined;
  const pipeline = pipelineInsights as PipelineInsights | undefined;

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-brand" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contactId && !insights) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-brand" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No insights available for this contact.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isVisible) {
    return (
      <div className={cn("", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="w-full justify-start"
        >
          <Brain className="h-4 w-4 mr-2" />
          Show AI Insights
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-brand" />
            <CardTitle className="text-lg">
              AI Insights {contactId ? "- Contact" : "- Pipeline"}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {contactId && insights && (
          <CardDescription>
            Deal Probability: {Math.round(insights.dealProbability * 100)}%
          </CardDescription>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Contact-specific insights */}
          {contactId && insights && (
            <>
              {/* Deal Probability */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Deal Probability</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(insights.dealProbability * 100)}%
                  </span>
                </div>
                <Progress value={insights.dealProbability * 100} className="h-2" />
              </div>

              <Separator />

              {/* Next Actions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {insights.nextActions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <span className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-brand" />
                    Best Contact Time
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{insights.bestContactTime}</p>
                </div>
                <div>
                  <span className="text-sm font-medium flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
                    Communication Style
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{insights.communicationStyle}</p>
                </div>
              </div>

              {insights.insights.length > 0 && (
                <>
                  <Separator />
                  
                  {/* Individual Insights */}
                  <div>
                    <h4 className="font-medium mb-3">Key Insights</h4>
                    <div className="space-y-3">
                      {insights.insights.map((insight, index) => {
                        const Icon = categoryIcons[insight.category];
                        const colorClass = categoryColors[insight.category];
                        
                        return (
                          <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={cn("w-2 h-2 rounded-full", colorClass)}></div>
                                <span className="text-sm font-medium">{insight.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {insight.score}/100
                                </Badge>
                              </div>
                              <Icon className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600">{insight.description}</p>
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="font-medium text-brand">Action:</span>
                              <span className="text-gray-600">{insight.actionable}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400 capitalize">{insight.category}</span>
                              <span className="text-xs text-gray-400">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Pipeline insights */}
          {!contactId && pipeline && (
            <>
              <div>
                <h4 className="font-medium mb-2">Pipeline Summary</h4>
                <p className="text-sm text-gray-600">{pipeline.summary}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                {/* Opportunities */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center text-green-700">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Opportunities
                  </h4>
                  <ul className="space-y-1">
                    {pipeline.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center text-red-700">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Risks
                  </h4>
                  <ul className="space-y-1">
                    {pipeline.risks.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center text-brand">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {pipeline.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-brand rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}