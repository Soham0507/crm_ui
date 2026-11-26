import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  Trash2, 
  Edit, 
  Tag, 
  Archive,
  Mail,
  Phone,
  TrendingUp,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { Contact } from "@shared/schema";

interface BulkActionsBarProps {
  selectedContacts: Set<number>;
  contacts: Contact[];
  onClearSelection: () => void;
  onContactsUpdated: () => void;
}

export default function BulkActionsBar({ 
  selectedContacts, 
  contacts, 
  onClearSelection,
  onContactsUpdated 
}: BulkActionsBarProps) {
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkTag, setBulkTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selectedContactsList = contacts.filter(contact => selectedContacts.has(contact.id));
  const totalValue = selectedContactsList.reduce((sum, contact) => sum + (contact.dealValue || 0), 0);

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: number[]; data: any }) => {
      await Promise.all(
        ids.map(id => apiRequest('PATCH', `/api/contacts/${id}`, data))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      onContactsUpdated();
      toast({
        title: "Bulk update completed",
        description: `Updated ${selectedContacts.size} contacts successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contacts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(
        ids.map(id => apiRequest('DELETE', `/api/contacts/${id}`))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      onContactsUpdated();
      toast({
        title: "Contacts deleted",
        description: `Successfully deleted ${selectedContacts.size} contacts.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contacts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBulkStatusUpdate = () => {
    if (!bulkStatus) return;
    
    const ids = Array.from(selectedContacts);
    bulkUpdateMutation.mutate({
      ids,
      data: { status: bulkStatus }
    });
    setBulkStatus('');
  };

  const handleBulkTagAdd = () => {
    if (!bulkTag.trim()) return;

    const ids = Array.from(selectedContacts);
    const newTag = bulkTag.trim();
    
    // Add tag to existing tags for each contact
    selectedContactsList.forEach(contact => {
      const existingTags = contact.tags || [];
      if (!existingTags.includes(newTag)) {
        const updatedTags = [...existingTags, newTag];
        bulkUpdateMutation.mutate({
          ids: [contact.id],
          data: { tags: updatedTags }
        });
      }
    });

    setBulkTag('');
    setShowTagInput(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedContacts.size} contacts? This action cannot be undone.`)) {
      const ids = Array.from(selectedContacts);
      bulkDeleteMutation.mutate(ids);
    }
  };

  const handleBulkEmail = () => {
    const emails = selectedContactsList
      .map(contact => contact.email)
      .filter(Boolean)
      .join(',');
    
    if (emails) {
      window.open(`mailto:${emails}`);
    } else {
      toast({
        title: "No email addresses",
        description: "None of the selected contacts have email addresses.",
        variant: "destructive",
      });
    }
  };

  const handleExportSelected = () => {
    const csvHeader = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Tags'];
    const csvRows = selectedContactsList.map(contact => [
      contact.name,
      contact.email,
      contact.phone || '',
      contact.company || '',
      contact.status,
      contact.dealValue || 0,
      (contact.tags || []).join('; ')
    ]);

    const csvContent = [
      csvHeader.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `selected-contacts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedContacts.size === 0) return null;

  return (
    <div className="bg-brand-soft border border-brand/20 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-brand">
              {selectedContacts.size} selected
            </Badge>
            <span className="text-sm text-gray-600">
              Total value: <span className="font-semibold">{formatCurrency(totalValue)}</span>
            </span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Status Update */}
            <div className="flex items-center space-x-1">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="closed-won">Closed Won</SelectItem>
                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
              {bulkStatus && (
                <Button
                  size="sm"
                  onClick={handleBulkStatusUpdate}
                  disabled={bulkUpdateMutation.isPending}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Update
                </Button>
              )}
            </div>

            {/* Tag Addition */}
            {showTagInput ? (
              <div className="flex items-center space-x-1">
                <Input
                  placeholder="Add tag"
                  value={bulkTag}
                  onChange={(e) => setBulkTag(e.target.value)}
                  className="w-24 h-8"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleBulkTagAdd();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleBulkTagAdd}
                  disabled={!bulkTag.trim() || bulkUpdateMutation.isPending}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowTagInput(false);
                    setBulkTag('');
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTagInput(true)}
              >
                <Tag className="h-3 w-3 mr-1" />
                Tag
              </Button>
            )}

            {/* Communication */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkEmail}
            >
              <Mail className="h-3 w-3 mr-1" />
              Email All
            </Button>

            {/* Export */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportSelected}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Destructive Actions */}
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>

          {/* Clear Selection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}