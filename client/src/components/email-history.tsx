import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { 
  Mail, 
  Send, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Eye,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface EmailHistoryProps {
  contactId: number;
}

interface Email {
  id: number;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  repliedAt?: string;
  error?: string;
  createdAt: string;
}

export default function EmailHistory({ contactId }: EmailHistoryProps) {
  const [expandedEmails, setExpandedEmails] = useState<number[]>([]);

  const { data: emails = [], isLoading, error } = useQuery<Email[]>({
    queryKey: [`/api/contacts/${contactId}/emails`],
    enabled: !!contactId
  });

  const toggleEmailExpanded = (emailId: number) => {
    setExpandedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sending':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      sent: 'bg-green-100 text-green-800',
      sending: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status] || variants.draft}>
        {status}
      </Badge>
    );
  };

  const getEngagementIndicators = (email: Email) => {
    const indicators = [];
    
    if (email.openedAt) {
      indicators.push(
        <div key="opened" className="flex items-center gap-1 text-xs text-green-600">
          <Eye className="h-3 w-3" />
          Opened
        </div>
      );
    }
    
    if (email.clickedAt) {
      indicators.push(
        <div key="clicked" className="flex items-center gap-1 text-xs text-blue-600">
          <ExternalLink className="h-3 w-3" />
          Clicked
        </div>
      );
    }
    
    if (email.repliedAt) {
      indicators.push(
        <div key="replied" className="flex items-center gap-1 text-xs text-purple-600">
          <Mail className="h-3 w-3" />
          Replied
        </div>
      );
    }
    
    return indicators;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load email history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2" />
            <p>No emails sent to this contact yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email History
          <Badge variant="secondary">{emails.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {emails.map((email) => {
              const isExpanded = expandedEmails.includes(email.id);
              const engagementIndicators = getEngagementIndicators(email);
              
              return (
                <Card key={email.id} className="overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleEmailExpanded(email.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(email.status)}
                        <h4 className="font-medium text-sm">{email.subject}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(email.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEmailExpanded(email.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        To: {email.to}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {email.sentAt 
                          ? format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')
                          : format(new Date(email.createdAt), 'MMM d, yyyy h:mm a')
                        }
                      </div>
                    </div>

                    {engagementIndicators.length > 0 && (
                      <div className="flex items-center gap-3 mt-2">
                        {engagementIndicators}
                      </div>
                    )}

                    {email.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        Error: {email.error}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-muted/30">
                      {email.cc && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <strong>CC:</strong> {email.cc}
                        </p>
                      )}
                      {email.bcc && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <strong>BCC:</strong> {email.bcc}
                        </p>
                      )}
                      <div className="mt-3">
                        <p className="text-sm whitespace-pre-wrap">{email.body}</p>
                      </div>
                      {email.htmlBody && email.htmlBody !== email.body && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">HTML Version:</p>
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}