import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Mail, 
  Phone, 
  Building, 
  DollarSign,
  CheckCircle,
  Clock,
  MessageSquare,
  Calendar,
  Edit
} from "lucide-react";
import { formatCurrency, formatRelativeDate, getStatusColor, getStatusLabel, formatPhone } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AIInsightsPanel from "@/components/ai-insights-panel";
import type { ContactWithDetails } from "@shared/schema";

interface ContactModalProps {
  contactId: number;
  isOpen: boolean;
  onClose: () => void;
  startInEditMode?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ContactModal({ contactId, isOpen, onClose, startInEditMode = false }: ContactModalProps) {
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<ContactWithDetails>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contact, isLoading } = useQuery<ContactWithDetails>({
    queryKey: ['/api/contacts', contactId],
    enabled: isOpen && !!contactId,
  });

  // Initialize edit form when contact data loads
  React.useEffect(() => {
    if (contact && !isEditing) {
      setEditedContact({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        dealValue: contact.dealValue,
        status: contact.status
      });
    }
  }, [contact, isEditing]);

  // Start in edit mode if requested
  React.useEffect(() => {
    if (startInEditMode && contact && isOpen) {
      setIsEditing(true);
    }
  }, [startInEditMode, contact, isOpen]);

  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest('POST', `/api/contacts/${contactId}/notes`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId] });
      setNewNote("");
      toast({
        title: "Note added",
        description: "Your note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (title: string) =>
      apiRequest('POST', `/api/contacts/${contactId}/tasks`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId] });
      setNewTask("");
      toast({
        title: "Task added",
        description: "Your task has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: number; completed: boolean }) =>
      apiRequest('PATCH', `/api/tasks/${taskId}`, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId] });
      toast({
        title: "Task updated",
        description: "Task has been marked as completed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTaskMutation.mutate(newTask.trim());
    }
  };

  const handleTaskToggle = (taskId: number, completed: boolean) => {
    updateTaskMutation.mutate({ taskId, completed });
  };

  const updateContactMutation = useMutation({
    mutationFn: (data: Partial<ContactWithDetails>) =>
      apiRequest('PATCH', `/api/contacts/${contactId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setIsEditing(false);
      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully.",
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

  const handleSaveContact = () => {
    updateContactMutation.mutate(editedContact);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (contact) {
      setEditedContact({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        dealValue: contact.dealValue,
        status: contact.status
      });
    }
  };

  // Reset edit state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'note_added':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'call':
        return <Phone className="h-4 w-4 text-purple-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <DialogHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-brand-soft text-brand font-bold text-lg">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {isEditing ? (
                    <Input
                      value={editedContact.name || ''}
                      onChange={(e) => setEditedContact(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xl font-semibold border-none p-0 h-auto bg-transparent focus:ring-0"
                      placeholder="Contact name"
                    />
                  ) : contact.name}
                </DialogTitle>
                <p className="text-sm text-gray-500">{contact.company}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveContact} disabled={updateContactMutation.isPending}>
                    Save
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Content */}
        <div className="grid grid-cols-2 gap-8 py-6">
          {/* Contact Details */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedContact.email || ''}
                        onChange={(e) => setEditedContact(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 text-sm text-gray-900">{contact.email}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={editedContact.phone || ''}
                        onChange={(e) => setEditedContact(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                        placeholder="Phone number"
                      />
                    ) : (
                      <div className="mt-1 text-sm text-gray-900">{contact.phone ? formatPhone(contact.phone) : 'No phone'}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    {isEditing ? (
                      <Input
                        value={editedContact.company || ''}
                        onChange={(e) => setEditedContact(prev => ({ ...prev, company: e.target.value }))}
                        className="mt-1"
                        placeholder="Company name"
                      />
                    ) : (
                      <div className="mt-1 text-sm text-gray-900">{contact.company || 'No company'}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Deal Value</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedContact.dealValue || 0}
                        onChange={(e) => setEditedContact(prev => ({ ...prev, dealValue: Number(e.target.value) }))}
                        className="mt-1"
                        placeholder="0"
                      />
                    ) : (
                      <div className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(contact.dealValue || 0)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Select
                        value={editedContact.status || contact.status}
                        onValueChange={(value) => setEditedContact(prev => ({ ...prev, status: value as any }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="churned">Churned</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(contact.status)}>
                        {getStatusLabel(contact.status)}
                      </Badge>
                    )}
                  </div>
                </div>

                {contact.tags && contact.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Notes</h4>
              <div className="space-y-3 mb-4">
                {contact.notes.length === 0 ? (
                  <p className="text-sm text-gray-500">No notes yet. Add the first note below.</p>
                ) : (
                  contact.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Note</span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeDate(note.createdAt!)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Note Form */}
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>

          {/* Tasks & Activity */}
          <div className="space-y-6">
            {/* Tasks */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Tasks</h4>
              
              <div className="space-y-2 mb-4">
                {contact.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">No tasks yet. Add the first task below.</p>
                ) : (
                  contact.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`flex items-center p-3 rounded-lg ${
                        task.completed ? 'bg-green-50' : 'bg-yellow-50'
                      }`}
                    >
                      <Checkbox
                        checked={task.completed || false}
                        onCheckedChange={(checked) => 
                          handleTaskToggle(task.id, checked as boolean)
                        }
                        disabled={updateTaskMutation.isPending}
                      />
                      <div className="ml-3 flex-1">
                        <p className={`text-sm font-medium ${
                          task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeDate(task.createdAt!)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Task Form */}
              <div className="space-y-2">
                <Input
                  placeholder="Add a task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTask.trim()) {
                      handleAddTask();
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddTask}
                  disabled={!newTask.trim() || addTaskMutation.isPending}
                >
                  Add Task
                </Button>
              </div>
            </div>

            <Separator />

            {/* Activity History */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
              <div className="space-y-3">
                {contact.activities.length === 0 ? (
                  <p className="text-sm text-gray-500">No activity yet.</p>
                ) : (
                  contact.activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeDate(activity.createdAt!)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h4>
          <AIInsightsPanel contactId={contactId} />
        </div>

        {/* Modal Footer */}
        <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
