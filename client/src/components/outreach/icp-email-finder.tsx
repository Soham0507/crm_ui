import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Globe, 
  Mail, 
  User, 
  Building2, 
  Loader2,
  Download,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Linkedin,
  Twitter,
  Phone,
  MapPin,
  Link,
  UserPlus,
  Sparkles,
  Eye,
  EyeOff,
  Filter,
  RefreshCw
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExtractedContact {
  id: string;
  name: string;
  role: string;
  email: string;
  emailConfidence: 'verified' | 'high' | 'medium' | 'low' | 'predicted';
  phone?: string;
  linkedin?: string;
  twitter?: string;
  source: string;
  department?: string;
}

interface CompanyInfo {
  domain: string;
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  emailPattern?: string;
  totalContactsFound: number;
}

export default function ICPEmailFinder() {
  const { toast } = useToast();
  const [companyInput, setCompanyInput] = useState("");
  const [searchType, setSearchType] = useState<'domain' | 'name'>('domain');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [extractedContacts, setExtractedContacts] = useState<ExtractedContact[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [showPredicted, setShowPredicted] = useState(true);
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  // Find contacts from company website
  const findContactsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/outreach/find-contacts', {
        method: 'POST',
        body: JSON.stringify({
          input: companyInput,
          type: searchType,
          options: {
            includePredicted: showPredicted,
            deepScrape: true,
            verifyEmails: true
          }
        })
      });
    },
    onSuccess: (data) => {
      setExtractedContacts(data.contacts || []);
      setCompanyInfo(data.company || null);
      toast({
        title: `Found ${data.contacts?.length || 0} contacts`,
        description: `Extracted from ${data.company?.name || companyInput}`
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Failed to extract contacts. Please check the domain and try again."
      });
    }
  });

  // Enrich contact with additional data
  const enrichContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return await apiRequest('/api/outreach/enrich-contact', {
        method: 'POST',
        body: JSON.stringify({
          contactId,
          name: extractedContacts.find(c => c.id === contactId)?.name,
          company: companyInfo?.name,
          domain: companyInfo?.domain
        })
      });
    },
    onSuccess: (data, contactId) => {
      setExtractedContacts(prev => 
        prev.map(c => c.id === contactId ? { ...c, ...data } : c)
      );
      toast({
        title: "Contact enriched",
        description: "Additional information has been added"
      });
    }
  });

  // Save contacts to CRM
  const saveContactsMutation = useMutation({
    mutationFn: async () => {
      const contactsToSave = extractedContacts.filter(c => selectedContacts.includes(c.id));
      return await apiRequest('/api/contacts/bulk-create', {
        method: 'POST',
        body: JSON.stringify({
          contacts: contactsToSave.map(c => ({
            firstName: c.name.split(' ')[0],
            lastName: c.name.split(' ').slice(1).join(' '),
            email: c.email,
            phone: c.phone,
            jobTitle: c.role,
            company: companyInfo?.name,
            linkedinUrl: c.linkedin,
            source: 'Email Finder',
            notes: `Extracted from ${c.source} on ${companyInfo?.domain}`
          }))
        })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Contacts saved",
        description: `${selectedContacts.length} contacts added to your CRM`
      });
      setSelectedContacts([]);
    }
  });

  // Export contacts as CSV
  const handleExportCSV = () => {
    const contactsToExport = extractedContacts.filter(c => 
      selectedContacts.length === 0 || selectedContacts.includes(c.id)
    );

    const csv = [
      ['Name', 'Role', 'Email', 'Phone', 'LinkedIn', 'Department', 'Source', 'Confidence'].join(','),
      ...contactsToExport.map(c => [
        c.name,
        c.role,
        c.email,
        c.phone || '',
        c.linkedin || '',
        c.department || '',
        c.source,
        c.emailConfidence
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyInfo?.name || 'contacts'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter contacts
  const filteredContacts = extractedContacts.filter(c => {
    if (!showPredicted && c.emailConfidence === 'predicted') return false;
    if (filterRole && !c.role.toLowerCase().includes(filterRole.toLowerCase())) return false;
    if (filterDepartment && !c.department?.toLowerCase().includes(filterDepartment.toLowerCase())) return false;
    return true;
  });

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, { color: string, icon: JSX.Element }> = {
      verified: { color: 'bg-green-500', icon: <CheckCircle2 className="h-3 w-3" /> },
      high: { color: 'bg-blue-500', icon: <CheckCircle2 className="h-3 w-3" /> },
      medium: { color: 'bg-yellow-500', icon: <AlertCircle className="h-3 w-3" /> },
      low: { color: 'bg-orange-500', icon: <AlertCircle className="h-3 w-3" /> },
      predicted: { color: 'bg-purple-500', icon: <Sparkles className="h-3 w-3" /> }
    };

    const variant = variants[confidence] || variants.low;

    return (
      <Badge className={`${variant.color} text-white flex items-center gap-1`}>
        {variant.icon}
        {confidence}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-requisor-turquoise" />
            Find Contacts from Company Website
          </CardTitle>
          <CardDescription>
            Enter a company domain or name to extract contacts from their website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs value={searchType} onValueChange={(v: any) => setSearchType(v)}>
              <TabsList className="grid grid-cols-2 w-[200px]">
                <TabsTrigger value="domain">Domain</TabsTrigger>
                <TabsTrigger value="name">Company Name</TabsTrigger>
              </TabsList>

              <TabsContent value="domain" className="space-y-4">
                <div>
                  <Label>Company Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="example.com"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => findContactsMutation.mutate()}
                      disabled={!companyInput || findContactsMutation.isPending}
                      className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                    >
                      {findContactsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Find Contacts
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll scan the website to find team members, emails, and social profiles
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="name" className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Acme Corporation"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => findContactsMutation.mutate()}
                      disabled={!companyInput || findContactsMutation.isPending}
                      className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                    >
                      {findContactsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Find Contacts
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll search for the company's website and extract contact information
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-predicted"
                  checked={showPredicted}
                  onCheckedChange={(checked) => setShowPredicted(checked as boolean)}
                />
                <Label htmlFor="show-predicted" className="text-sm">
                  Show predicted emails
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      {companyInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {companyInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {companyInfo.domain && (
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{companyInfo.domain}</span>
                </div>
              )}
              {companyInfo.industry && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{companyInfo.industry}</span>
                </div>
              )}
              {companyInfo.size && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{companyInfo.size} employees</span>
                </div>
              )}
              {companyInfo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{companyInfo.location}</span>
                </div>
              )}
            </div>
            {companyInfo.emailPattern && (
              <Alert className="mt-4">
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Detected email pattern: <code>{companyInfo.emailPattern}</code>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {extractedContacts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Found {filteredContacts.length} Contacts
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveContactsMutation.mutate()}
                  disabled={selectedContacts.length === 0 || saveContactsMutation.isPending}
                  className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                >
                  {saveContactsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save {selectedContacts.length > 0 ? selectedContacts.length : ''} to CRM
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Filter by role..."
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-48"
                prefix={<Filter className="h-4 w-4" />}
              />
              <Input
                placeholder="Filter by department..."
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-48"
              />
              {(filterRole || filterDepartment) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterRole("");
                    setFilterDepartment("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Contacts Table */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.length === filteredContacts.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContacts(filteredContacts.map(c => c.id));
                          } else {
                            setSelectedContacts([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContacts([...selectedContacts, contact.id]);
                            } else {
                              setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            {contact.department && (
                              <p className="text-xs text-muted-foreground">{contact.department}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{contact.role}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`mailto:${contact.email}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(contact.emailConfidence)}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">{contact.source}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {contact.linkedin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(contact.linkedin, '_blank')}
                            >
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          )}
                          {contact.phone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => enrichContactMutation.mutate(contact.id)}
                            disabled={enrichContactMutation.isPending}
                          >
                            {enrichContactMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!findContactsMutation.isPending && extractedContacts.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contacts found yet</h3>
          <p className="text-muted-foreground">
            Enter a company domain or name to start finding contacts
          </p>
        </div>
      )}

      {/* Loading State */}
      {findContactsMutation.isPending && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-requisor-turquoise" />
              <p className="text-lg font-medium">Scanning website...</p>
              <div className="space-y-2 text-sm text-muted-foreground text-center">
                <p>• Analyzing team pages</p>
                <p>• Extracting contact information</p>
                <p>• Verifying email addresses</p>
                <p>• Enriching with social profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}