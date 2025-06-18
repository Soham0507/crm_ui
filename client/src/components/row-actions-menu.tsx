import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  MessageSquare, 
  TrendingUp, 
  Archive, 
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Contact } from "@shared/schema";

interface RowActionsMenuProps {
  contact: Contact;
  onViewDetails: () => void;
  onEdit: () => void;
}

export default function RowActionsMenu({ contact, onViewDetails, onEdit }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/contacts/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      toast({
        title: "Status updated",
        description: "Contact status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(contact.id);
    }
    setIsOpen(false);
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({ id: contact.id, status: newStatus });
    setIsOpen(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'call':
        if (contact.phone) {
          window.open(`tel:${contact.phone}`);
        } else {
          toast({
            title: "No phone number",
            description: "This contact doesn't have a phone number.",
            variant: "destructive",
          });
        }
        break;
      case 'email':
        if (contact.email) {
          window.open(`mailto:${contact.email}`);
        }
        break;
      case 'schedule':
        // In a real app, this would open a calendar integration
        toast({
          title: "Calendar integration",
          description: "Calendar scheduling would open here.",
        });
        break;
    }
    setIsOpen(false);
  };

  const canConvertToOpportunity = contact.status === 'lead' || contact.status === 'qualified';
  const canArchive = ['closed-won', 'closed-lost'].includes(contact.status);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Header with contact info */}
        <div className="px-2 py-2 border-b">
          <div className="font-medium text-sm truncate">{contact.name}</div>
          <div className="flex items-center justify-between mt-1">
            <Badge className={getStatusColor(contact.status)} variant="secondary">
              {getStatusLabel(contact.status)}
            </Badge>
            <span className="text-xs font-medium text-gray-600">
              {formatCurrency(contact.dealValue || 0)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="py-1">
          <DropdownMenuItem onClick={onViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Contact
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        {/* Communication Actions */}
        <div className="py-1">
          <DropdownMenuItem 
            onClick={() => handleQuickAction('call')}
            disabled={!contact.phone}
          >
            <Phone className="mr-2 h-4 w-4" />
            Call Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickAction('email')}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickAction('schedule')}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Meeting
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        {/* Status Actions */}
        <div className="py-1">
          {canConvertToOpportunity && (
            <DropdownMenuItem onClick={() => handleStatusChange('qualified')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Convert to Opportunity
            </DropdownMenuItem>
          )}
          
          {contact.status !== 'closed-won' && (
            <DropdownMenuItem onClick={() => handleStatusChange('closed-won')}>
              <DollarSign className="mr-2 h-4 w-4" />
              Mark as Won
            </DropdownMenuItem>
          )}

          {contact.status === 'proposal' && (
            <DropdownMenuItem onClick={() => handleStatusChange('closed-lost')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Mark as Lost
            </DropdownMenuItem>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Destructive Actions */}
        <div className="py-1">
          {canArchive && (
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              Archive Contact
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Contact
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}