import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Edit2, 
  Save, 
  XCircle,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  MessageSquare,
  CheckSquare2,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import type { ContactWithDetails } from "@shared/schema";

interface ContactDetailsSidebarProps {
  contactId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function ContactDetailsSidebar({ contactId, isOpen, onClose }: ContactDetailsSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<ContactWithDetails>>({});
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contact, isLoading, error } = useQuery<ContactWithDetails>({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: isOpen && !!contactId,
  });

  // Initialize edit form when contact data loads
  useEffect(() => {
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
  }, [contact]);

  const updateContactMutation = useMutation({
    mutationFn: (data: Partial<ContactWithDetails>) =>
      apiRequest('PATCH', `/api/contacts/${contactId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      setIsEditing(false);
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

  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest('POST', `/api/contacts/${contactId}/notes`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      setNewNote("");
      toast({
        title: "Note added",
        description: "Your note has been saved.",
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
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      setNewTask("");
      toast({
        title: "Task added",
        description: "Your task has been created.",
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

  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: number; completed: boolean }) =>
      apiRequest('PATCH', `/api/tasks/${taskId}`, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
    },
  });

  const handleSave = () => {
    updateContactMutation.mutate(editedContact);
  };

  const handleCancel = () => {
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

  if (!isOpen || !contactId) return null;

  return (
    <div className={`fixed right-0 top-0 h-full w-96 overflow-hidden rounded-l-[24px] bg-white shadow-depth-lg transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } z-50`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Contact Details</h2>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded">
              {error.message.includes('401') ? (
                <div>
                  <p className="font-medium mb-1">Not logged in</p>
                  <p className="text-xs">Please log in to view contact details.</p>
                  <Button 
                    size="sm" 
                    className="mt-2 bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                    onClick={() => window.location.href = '/api/login'}
                  >
                    Log In
                  </Button>
                </div>
              ) : (
                `Error loading contact: ${error.message}`
              )}
            </div>
          ) : contact && (
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-requisor-turquoise/10 text-requisor-turquoise font-medium">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editedContact.name || ''}
                    onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                    className="mb-2"
                    placeholder="Contact name"
                  />
                ) : (
                  <h3 className="font-medium text-lg">{contact.name}</h3>
                )}
                <Badge className={getStatusColor(contact.status)} variant="secondary">
                  {getStatusLabel(contact.status)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {contact && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start px-6 bg-gray-50">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="px-6 py-4 space-y-4">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700">Contact Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedContact.email || ''}
                          onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      ) : (
                        <p className="text-sm">{contact.email || 'No email'}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        Phone
                      </Label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={editedContact.phone || ''}
                          onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      ) : (
                        <p className="text-sm">{contact.phone || 'No phone'}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        Company
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedContact.company || ''}
                          onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
                          placeholder="Company name"
                        />
                      ) : (
                        <p className="text-sm">{contact.company || 'No company'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deal Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700">Deal Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500 flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Deal Value
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedContact.dealValue || ''}
                          onChange={(e) => setEditedContact({ ...editedContact, dealValue: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      ) : (
                        <p className="text-sm font-medium">{formatCurrency(contact.dealValue || 0)}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Status</Label>
                      {isEditing ? (
                        <Select 
                          value={editedContact.status || 'lead'} 
                          onValueChange={(value) => setEditedContact({ ...editedContact, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="closed-won">Won</SelectItem>
                            <SelectItem value="closed-lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getStatusColor(contact.status)} variant="secondary">
                          {getStatusLabel(contact.status)}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created
                      </Label>
                      <p className="text-sm">{contact.createdAt ? formatDate(contact.createdAt) : 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-700">Notes</h4>
                    <Badge variant="secondary">{contact.notes?.length || 0}</Badge>
                  </div>

                  {/* Add new note */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => newNote.trim() && addNoteMutation.mutate(newNote)}
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                      className="w-full bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>

                  <Separator />

                  {/* Notes list */}
                  <div className="space-y-3">
                    {contact.notes?.map((note) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {note.createdAt ? formatDate(note.createdAt) : 'Unknown'}
                        </p>
                      </div>
                    ))}
                    {(!contact.notes || contact.notes.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-700">Tasks</h4>
                    <Badge variant="secondary">{contact.tasks?.filter(t => !t.completed).length || 0} open</Badge>
                  </div>

                  {/* Add new task */}
                  <div className="space-y-2">
                    <Input
                      placeholder="Add a task..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newTask.trim()) {
                          addTaskMutation.mutate(newTask);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => newTask.trim() && addTaskMutation.mutate(newTask)}
                      disabled={!newTask.trim() || addTaskMutation.isPending}
                      className="w-full bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                    >
                      <CheckSquare2 className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>

                  <Separator />

                  {/* Tasks list */}
                  <div className="space-y-2">
                    {contact.tasks?.map((task) => (
                      <div 
                        key={task.id} 
                        className={`flex items-center space-x-2 p-2 rounded-lg ${
                          task.completed ? 'bg-gray-50' : 'bg-white border'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed || false}
                          onChange={(e) => toggleTaskMutation.mutate({ 
                            taskId: task.id, 
                            completed: e.target.checked 
                          })}
                          className="rounded text-requisor-turquoise"
                        />
                        <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {(!contact.tasks || contact.tasks.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-700">Recent Activity</h4>
                    <Activity className="h-4 w-4 text-gray-400" />
                  </div>

                  <div className="space-y-3">
                    {contact.activities?.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="h-2 w-2 bg-requisor-turquoise rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.createdAt ? formatDate(activity.createdAt) : 'Unknown'}</p>
                        </div>
                      </div>
                    ))}
                    {(!contact.activities || contact.activities.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No activity recorded</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}