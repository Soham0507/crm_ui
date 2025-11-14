import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Send, 
  Sparkles, 
  FileText, 
  Edit3, 
  RefreshCw,
  Save,
  X,
  User,
  Building2,
  Mail,
  Loader2,
  Wand2,
  Copy,
  Check
} from "lucide-react";
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor } from '@tiptap/react';

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: number;
  contactEmail?: string;
  contactName?: string;
  companyName?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Initial Outreach",
    category: "Cold Email",
    subject: "Quick question about {{company}}'s {{pain_point}}",
    body: "Hi {{firstName}},\n\nI noticed {{company}} is {{observation}}. Many companies in {{industry}} struggle with {{pain_point}}.\n\nWe've helped similar companies {{value_prop}}.\n\nWorth a quick chat to see if we can help {{company}} achieve {{desired_outcome}}?\n\nBest,\n{{sender_name}}"
  },
  {
    id: "2",
    name: "Follow Up",
    category: "Follow Up",
    subject: "Re: {{previous_subject}}",
    body: "Hi {{firstName}},\n\nJust wanted to bump this up in case it got buried. I know how busy things can get at {{company}}.\n\n{{follow_up_context}}\n\nWould {{suggested_time}} work for a brief call?\n\nBest,\n{{sender_name}}"
  },
  {
    id: "3",
    name: "Meeting Request",
    category: "Meeting",
    subject: "15-minute chat about {{topic}}?",
    body: "Hi {{firstName}},\n\n{{opener}}\n\nI'd love to show you how {{value_prop}}. \n\nDo you have 15 minutes this week or next? Here are a few times that work on my end:\n- {{time_slot_1}}\n- {{time_slot_2}}\n- {{time_slot_3}}\n\nLet me know what works best for you.\n\nBest,\n{{sender_name}}"
  }
];

export default function EmailComposer({ 
  open, 
  onOpenChange, 
  contactId,
  contactEmail,
  contactName,
  companyName 
}: EmailComposerProps) {
  const { toast } = useToast();
  const [to, setTo] = useState(contactEmail || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTone, setAiTone] = useState("professional");
  const [copied, setCopied] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  useEffect(() => {
    if (contactEmail) {
      setTo(contactEmail);
    }
  }, [contactEmail]);

  // Generate email with AI
  const generateEmailMutation = useMutation({
    mutationFn: async (params: { 
      prompt?: string, 
      action: 'generate' | 'rewrite' | 'summarize' | 'change_tone',
      tone?: string 
    }) => {
      return await apiRequest('/api/outreach/generate-email', {
        method: 'POST',
        body: JSON.stringify({
          prompt: params.prompt || aiPrompt,
          action: params.action,
          tone: params.tone || aiTone,
          context: {
            to,
            contactName,
            companyName,
            currentSubject: subject,
            currentBody: editor?.getText() || ""
          }
        })
      });
    },
    onSuccess: (data) => {
      if (data.subject) setSubject(data.subject);
      if (data.body && editor) {
        editor.commands.setContent(data.body);
      }
      toast({
        title: "Email generated",
        description: "AI has generated your email content"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Failed to generate email with AI"
      });
    }
  });

  // Send email
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to,
          cc,
          bcc,
          subject,
          body: editor?.getText() || "",
          htmlBody: editor?.getHTML() || "",
          contactId
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully"
      });
      onOpenChange(false);
      // Reset form
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      editor?.commands.clearContent();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: "Failed to send email. Please try again."
      });
    }
  });

  // Save as draft
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/emails/draft', {
        method: 'POST',
        body: JSON.stringify({
          to,
          cc,
          bcc,
          subject,
          body: editor?.getText() || "",
          htmlBody: editor?.getHTML() || "",
          contactId
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Draft saved",
        description: "Your email has been saved as a draft"
      });
    }
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      editor?.commands.setContent(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const handleCopyToClipboard = () => {
    const content = editor?.getText() || "";
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
            {contactName && (
              <span className="text-sm text-muted-foreground">
                to {contactName} {companyName && `at ${companyName}`}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Sidebar with templates and AI */}
          <div className="w-80 border-r pr-4 overflow-y-auto">
            <Tabs defaultValue="templates" className="h-full">
              <TabsList className="w-full">
                <TabsTrigger value="templates" className="flex-1">
                  <FileText className="h-4 w-4 mr-1" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex-1">
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Assistant
                </TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-2">
                {emailTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer hover:bg-accent transition-colors ${
                      selectedTemplate === template.id ? 'border-requisor-turquoise' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.category}</p>
                        </div>
                        {selectedTemplate === template.id && (
                          <Check className="h-4 w-4 text-requisor-turquoise" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <div>
                  <Label>AI Tone</Label>
                  <Select value={aiTone} onValueChange={setAiTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>What should this email accomplish?</Label>
                  <Textarea
                    placeholder="E.g., Schedule a demo call with the prospect to show our product's value..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => generateEmailMutation.mutate({ action: 'generate' })}
                    disabled={!aiPrompt || generateEmailMutation.isPending}
                  >
                    {generateEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Generate Email
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateEmailMutation.mutate({ action: 'rewrite' })}
                    disabled={!editor?.getText() || generateEmailMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rewrite Email
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateEmailMutation.mutate({ action: 'summarize' })}
                    disabled={!editor?.getText() || generateEmailMutation.isPending}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Make Shorter
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateEmailMutation.mutate({ action: 'change_tone' })}
                    disabled={!editor?.getText() || generateEmailMutation.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Change Tone
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-xs text-muted-foreground">
                    AI Suggestions
                  </Label>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>• Keep emails under 150 words</p>
                    <p>• Use personalization tokens</p>
                    <p>• Include a clear CTA</p>
                    <p>• Reference specific pain points</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Email composer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cc">CC</Label>
                    <Input
                      id="cc"
                      type="email"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bcc">BCC</Label>
                    <Input
                      id="bcc"
                      type="email"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
              </div>

              <div className="flex-1 border rounded-md overflow-hidden">
                <div className="border-b p-2 flex items-center gap-2 bg-muted/50">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={editor?.isActive('bold') ? 'bg-muted' : ''}
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={editor?.isActive('italic') ? 'bg-muted' : ''}
                  >
                    <em>I</em>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
                  >
                    • List
                  </Button>
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[300px]">
                  {editor && (
                    <div className="min-h-[250px]">
                      <div 
                        className="ProseMirror prose prose-sm max-w-none p-4 focus:outline-none"
                        dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                        contentEditable
                        onInput={(e) => {
                          const target = e.target as HTMLDivElement;
                          editor.commands.setContent(target.innerHTML);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => saveDraftMutation.mutate()}
                  disabled={saveDraftMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={!to || !subject || !editor?.getText() || sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}