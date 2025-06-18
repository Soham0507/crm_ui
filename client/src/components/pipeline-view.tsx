import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, getStatusColor, formatRelativeDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@shared/schema";

interface PipelineViewProps {
  contacts: Contact[];
  onContactSelect: (id: number) => void;
}

interface PipelineColumn {
  id: string;
  title: string;
  status: string;
  contacts: Contact[];
  count: number;
  value: number;
}

export default function PipelineView({ contacts, onContactSelect }: PipelineViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: stats } = useQuery({
    queryKey: ['/api/pipeline/stats'],
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/contacts/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      toast({
        title: "Deal moved",
        description: "The deal has been moved to the new stage.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move deal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const columns: PipelineColumn[] = [
    {
      id: 'lead',
      title: 'Lead',
      status: 'lead',
      contacts: contacts.filter(c => c.status === 'lead'),
      count: stats?.pipeline?.lead?.count || 0,
      value: stats?.pipeline?.lead?.value || 0,
    },
    {
      id: 'qualified',
      title: 'Qualified',
      status: 'qualified',
      contacts: contacts.filter(c => c.status === 'qualified'),
      count: stats?.pipeline?.qualified?.count || 0,
      value: stats?.pipeline?.qualified?.value || 0,
    },
    {
      id: 'proposal',
      title: 'Proposal',
      status: 'proposal',
      contacts: contacts.filter(c => c.status === 'proposal'),
      count: stats?.pipeline?.proposal?.count || 0,
      value: stats?.pipeline?.proposal?.value || 0,
    },
    {
      id: 'closed',
      title: 'Closed',
      status: 'closed-won',
      contacts: contacts.filter(c => ['closed-won', 'closed-lost'].includes(c.status)),
      count: stats?.pipeline?.closed?.count || 0,
      value: stats?.pipeline?.closed?.value || 0,
    },
  ];

  const handleDragStart = (e: React.DragEvent, contact: Contact) => {
    e.dataTransfer.setData('text/plain', contact.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const contactId = parseInt(e.dataTransfer.getData('text/plain'));
    const contact = contacts.find(c => c.id === contactId);
    
    if (contact && contact.status !== targetStatus) {
      let newStatus = targetStatus;
      // For closed column, we need to determine if it's won or lost
      if (targetStatus === 'closed-won') {
        newStatus = 'closed-won'; // Default to won for now
      }
      
      updateContactMutation.mutate({ id: contactId, status: newStatus });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full px-6 py-6">
      {/* Pipeline Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Pipeline</h3>
            <p className="text-sm text-gray-600">Track deals through your sales process</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Total Pipeline Value: 
              <span className="font-semibold text-gray-900 ml-1">
                {formatCurrency(stats?.totalValue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-4 gap-6 h-full">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{column.title}</h4>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={
                      column.id === 'lead' ? 'bg-blue-100 text-blue-800' :
                      column.id === 'qualified' ? 'bg-green-100 text-green-800' :
                      column.id === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }
                  >
                    {column.count}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatCurrency(column.value)}
                  </span>
                </div>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-4 space-y-3 overflow-auto custom-scrollbar">
              {column.contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No deals in this stage
                </div>
              ) : (
                column.contacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                    draggable
                    onDragStart={(e) => handleDragStart(e, contact)}
                    onClick={() => onContactSelect(contact.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {contact.company || 'No Company'}
                          </h5>
                          <div className="flex items-center mt-1">
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs text-gray-500 truncate">
                              {contact.name}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 ml-2">
                          {formatCurrency(contact.dealValue || 0)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          {contact.tags?.slice(0, 2).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs px-1.5 py-0.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatRelativeDate(contact.updatedAt || contact.createdAt!)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
