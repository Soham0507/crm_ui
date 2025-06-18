import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, ChevronLeft, ChevronRight, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { formatCurrency, getStatusColor, getStatusLabel, formatPhone, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditableCell from "@/components/editable-cell";
import RowActionsMenu from "@/components/row-actions-menu";
import BulkActionsBar from "@/components/bulk-actions-bar";
import ColumnAnalytics from "@/components/column-analytics";
import type { Contact } from "@shared/schema";
import type { TableSettings } from "@/components/table-settings-modal";
import { isAfter, addDays } from "date-fns";

interface GridViewProps {
  contacts: Contact[];
  onContactSelect: (id: number) => void;
  tableSettings: TableSettings;
}

export default function GridView({ contacts, onContactSelect, tableSettings }: GridViewProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const itemsPerPage = tableSettings.pageSize;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const totalPages = Math.ceil(contacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContacts = contacts.slice(startIndex, endIndex);

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contact> }) =>
      apiRequest('PATCH', `/api/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      toast({
        title: "Contact updated",
        description: "Changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(currentContacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleSelectContact = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedContacts(newSelected);
  };

  const handleDeleteContact = (id: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(id);
    }
  };

  const handleCellUpdate = (contactId: number, field: string, value: any) => {
    updateContactMutation.mutate({
      id: contactId,
      data: { [field]: value }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Enhanced row styling based on data conditions
  const getRowClassName = (contact: Contact) => {
    const baseClass = "hover:bg-gray-50 cursor-pointer transition-colors";
    const classes = [baseClass];

    // Highlight high-value deals
    if ((contact.dealValue || 0) > 10000) {
      classes.push("border-l-4 border-l-green-400");
    }

    // Highlight overdue follow-ups (mock - in real app would check actual follow-up dates)
    const isHighPriority = contact.tags?.includes('priority') || contact.tags?.includes('hot');
    if (isHighPriority) {
      classes.push("bg-yellow-50");
    }

    return classes.join(" ");
  };

  // Get field type for editable cells
  const getFieldType = (columnKey: string): 'text' | 'email' | 'phone' | 'currency' | 'select' | 'date' | 'tags' => {
    switch (columnKey) {
      case 'email': return 'email';
      case 'phone': return 'phone';
      case 'dealValue': return 'currency';
      case 'status': return 'select';
      case 'createdAt':
      case 'updatedAt': return 'date';
      case 'tags': return 'tags';
      default: return 'text';
    }
  };

  const statusOptions = ['lead', 'qualified', 'proposal', 'closed-won', 'closed-lost'];

  const handleClearSelection = () => {
    setSelectedContacts(new Set());
  };

  const handleContactsUpdated = () => {
    setSelectedContacts(new Set());
  };

  return (
    <div className="h-full px-6 py-6">
      <BulkActionsBar
        selectedContacts={selectedContacts}
        contacts={contacts}
        onClearSelection={handleClearSelection}
        onContactsUpdated={handleContactsUpdated}
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedContacts.size === currentContacts.length && currentContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {tableSettings.columns.filter(col => col.visible).map((column) => (
                  <TableHead 
                    key={column.key}
                    className={
                      column.key === 'name' ? 'min-w-[250px]' :
                      column.key === 'actions' ? 'w-20' : ''
                    }
                  >
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableSettings.columns.filter(col => col.visible).length + 2} className="text-center py-12 text-gray-500">
                    No contacts found. Add your first contact to get started.
                  </TableCell>
                </TableRow>
              ) : (
                currentContacts.map((contact) => (
                  <TableRow 
                    key={contact.id} 
                    className={getRowClassName(contact)}
                    onClick={() => onContactSelect(contact.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={(checked) => 
                          handleSelectContact(contact.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    {tableSettings.columns.filter(col => col.visible).map((column) => (
                      <TableCell key={column.key} onClick={(e) => e.stopPropagation()}>
                        {column.key === 'name' ? (
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <EditableCell
                                value={contact.name}
                                type="text"
                                onSave={(value) => handleCellUpdate(contact.id, 'name', value)}
                                onCancel={() => {}}
                                placeholder="Contact name"
                              />
                              <EditableCell
                                value={contact.company}
                                type="text"
                                onSave={(value) => handleCellUpdate(contact.id, 'company', value)}
                                onCancel={() => {}}
                                placeholder="Company name"
                                className="text-sm text-gray-500 mt-1"
                              />
                            </div>
                            {/* Visual indicators */}
                            <div className="flex flex-col space-y-1">
                              {(contact.dealValue || 0) > 10000 && (
                                <TrendingUp className="h-4 w-4 text-green-600" title="High value deal" />
                              )}
                              {contact.tags?.includes('priority') && (
                                <AlertCircle className="h-4 w-4 text-orange-600" title="Priority contact" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <EditableCell
                            value={contact[column.key as keyof Contact]}
                            type={getFieldType(column.key)}
                            options={column.key === 'status' ? statusOptions : undefined}
                            onSave={(value) => handleCellUpdate(contact.id, column.key, value)}
                            onCancel={() => {}}
                            placeholder={`Enter ${column.label.toLowerCase()}`}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActionsMenu
                        contact={contact}
                        onViewDetails={() => onContactSelect(contact.id)}
                        onEdit={() => onContactSelect(contact.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {contacts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, contacts.length)} of {contacts.length} results
                </div>
                {selectedContacts.size > 0 && (
                  <div className="text-sm text-blue-600">
                    {selectedContacts.size} selected
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                >
                  {showAnalytics ? 'Hide' : 'Show'} Analytics
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Panel */}
      <ColumnAnalytics
        contacts={contacts}
        isVisible={showAnalytics}
        onToggle={() => setShowAnalytics(!showAnalytics)}
      />
    </div>
  );
}
