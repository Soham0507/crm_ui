import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Plus,
  Settings,
  Trash,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Shield,
} from "lucide-react";
import { SiGmail } from "react-icons/si";

interface EmailProviderAccount {
  id: number;
  provider: string;
  email: string;
  displayName?: string;
  isActive: boolean;
  isDefault: boolean;
  dailyLimit: number;
  sentToday: number;
  lastResetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function EmailAccounts() {
  const [connectDialog, setConnectDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch email accounts
  const { data: accounts = [], isLoading } = useQuery<EmailProviderAccount[]>({
    queryKey: ['/api/email-accounts'],
  });

  // Connect account mutation
  const connectMutation = useMutation({
    mutationFn: async (provider: 'gmail' | 'outlook') => {
      // In a real app, this would redirect to OAuth flow
      // For now, we'll create a mock account
      return apiRequest('/api/email-accounts/connect', {
        method: 'POST',
        body: JSON.stringify({ provider }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      setConnectDialog(false);
      setSelectedProvider(null);
      toast({
        title: "Email account connected",
        description: "Your email account has been successfully connected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect email account",
        variant: "destructive",
      });
    },
  });

  // Update account mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<EmailProviderAccount> }) => {
      return apiRequest(`/api/email-accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: "Account updated",
        description: "Email account settings have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update email account",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/email-accounts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      setDeleteAccountId(null);
      toast({
        title: "Account removed",
        description: "Email account has been disconnected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete email account",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (provider: 'gmail' | 'outlook') => {
    setSelectedProvider(provider);
    // In a real app, this would initiate OAuth flow
    // For demo, we'll simulate the connection
    connectMutation.mutate(provider);
  };

  const handleSetDefault = (id: number) => {
    updateMutation.mutate({ id, updates: { isDefault: true } });
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    updateMutation.mutate({ id, updates: { isActive } });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return <SiGmail className="h-5 w-5 text-red-500" />;
      case 'outlook':
        return <Mail className="h-5 w-5 text-blue-500" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const getUsagePercentage = (sentToday: number, dailyLimit: number) => {
    return Math.round((sentToday / dailyLimit) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Accounts</CardTitle>
              <CardDescription>
                Connect your email accounts to send campaigns
              </CardDescription>
            </div>
            <Button onClick={() => setConnectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No email accounts connected</p>
              <p className="text-sm text-gray-400 mt-2">
                Connect your Gmail or Outlook account to start sending campaigns
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => {
                const usagePercent = getUsagePercentage(account.sentToday, account.dailyLimit);
                return (
                  <div
                    key={account.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getProviderIcon(account.provider)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{account.email}</p>
                            {account.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                            {account.isActive ? (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {account.displayName && (
                            <p className="text-sm text-gray-500">{account.displayName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefault(account.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteAccountId(account.id)}
                        >
                          <Trash className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`active-${account.id}`}
                            checked={account.isActive}
                            onCheckedChange={(checked) => handleToggleActive(account.id, checked)}
                          />
                          <Label htmlFor={`active-${account.id}`} className="text-sm">
                            Active
                          </Label>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Daily usage: {account.sentToday} / {account.dailyLimit}
                        {usagePercent > 80 && (
                          <AlertCircle className="h-4 w-4 text-orange-500 inline ml-2" />
                        )}
                      </div>
                    </div>

                    {account.sentToday > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            usagePercent > 80
                              ? 'bg-orange-500'
                              : usagePercent > 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect Account Dialog */}
      <Dialog open={connectDialog} onOpenChange={setConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
            <DialogDescription>
              Choose your email provider to connect your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleConnect('gmail')}
              disabled={connectMutation.isPending}
            >
              <SiGmail className="h-6 w-6 text-red-500 mr-3" />
              <div className="text-left">
                <p className="font-medium">Gmail</p>
                <p className="text-sm text-gray-500">Connect your Google account</p>
              </div>
              {connectMutation.isPending && selectedProvider === 'gmail' && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto" />
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleConnect('outlook')}
              disabled={connectMutation.isPending}
            >
              <Mail className="h-6 w-6 text-blue-500 mr-3" />
              <div className="text-left">
                <p className="font-medium">Outlook</p>
                <p className="text-sm text-gray-500">Connect your Microsoft account</p>
              </div>
              {connectMutation.isPending && selectedProvider === 'outlook' && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto" />
              )}
            </Button>
          </div>
          <div className="flex items-start gap-2 p-3 bg-brand-soft rounded-xl">
            <Shield className="h-4 w-4 text-brand mt-0.5" />
            <p className="text-sm text-gray-600">
              Your email credentials are securely encrypted and only used to send emails on your behalf.
              We never store or access your email content.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove email account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the email account from your CRM. You can reconnect it at any time.
              Any ongoing campaigns using this account will be paused.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccountId && deleteMutation.mutate(deleteAccountId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}