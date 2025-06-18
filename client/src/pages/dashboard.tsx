import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import GridView from "@/components/grid-view";
import PipelineView from "@/components/pipeline-view";
import ContactModal from "@/components/contact-modal";
import AddContactModal from "@/components/add-contact-modal";
import ImportHelpModal from "@/components/import-help-modal";
import TableSettingsModal, { type TableSettings } from "@/components/table-settings-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus,
  Users,
  TrendingUp,
  HelpCircle,
  Settings
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Contact } from "@shared/schema";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<'grid' | 'pipeline'>('grid');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [tableSettings, setTableSettings] = useState<TableSettings>(() => {
    const saved = localStorage.getItem('crm-table-settings');
    return saved ? JSON.parse(saved) : {
      columns: [
        { key: 'name', label: 'Name & Company', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'email', label: 'Email', visible: true },
        { key: 'phone', label: 'Phone', visible: true },
        { key: 'dealValue', label: 'Deal Value', visible: true },
        { key: 'tags', label: 'Tags', visible: true },
        { key: 'createdAt', label: 'Created Date', visible: false },
        { key: 'updatedAt', label: 'Updated Date', visible: false },
      ],
      pageSize: 10,
      autoSave: true,
    };
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/pipeline/stats'],
  });

  const filteredContacts = contacts.filter((contact: Contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.status.toLowerCase().includes(query)
    );
  });

  const handleExport = async () => {
    try {
      const response = await fetch('/api/contacts/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const { mutate: importContacts, isPending: isImporting } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/stats'] });
      toast({
        title: "Import completed",
        description: result.message || `Successfully imported ${result.created} contacts`,
      });
      if (result.errors && result.errors.length > 0) {
        console.warn('Import warnings:', result.errors);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import contacts. Please check your CSV file format.",
        variant: "destructive",
      });
    },
  });

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    importContacts(file);
    // Reset the input
    event.target.value = '';
  };

  const handleTableSettingsSave = (newSettings: TableSettings) => {
    setTableSettings(newSettings);
    if (newSettings.autoSave) {
      localStorage.setItem('crm-table-settings', JSON.stringify(newSettings));
    }
    toast({
      title: "Settings saved",
      description: "Your table preferences have been updated.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentView === 'grid' ? 'Grid View' : 'Pipeline View'}
                </h2>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <div className="w-1.5 h-1.5 mr-1.5 bg-green-400 rounded-full"></div>
                    <Users className="h-3 w-3 mr-1" />
                    {stats?.totalContacts || 0} Contacts
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <div className="w-1.5 h-1.5 mr-1.5 bg-blue-400 rounded-full"></div>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stats?.activeDeals || 0} Active Deals
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search contacts, deals..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters & Settings */}
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTableSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Table
                </Button>

                {/* Import/Export */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <div className="flex items-center space-x-1">
                    <Button variant="outline" size="sm" asChild disabled={isImporting}>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {isImporting ? 'Importing...' : 'Import CSV'}
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleImport}
                          disabled={isImporting}
                        />
                      </label>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowImportHelp(true)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      title="Import help"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Add Contact */}
                <Button onClick={() => setShowAddContact(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'grid' ? (
            <GridView 
              contacts={filteredContacts} 
              onContactSelect={setSelectedContactId}
              tableSettings={tableSettings}
            />
          ) : (
            <PipelineView 
              contacts={filteredContacts}
              onContactSelect={setSelectedContactId}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedContactId && (
        <ContactModal
          contactId={selectedContactId}
          isOpen={!!selectedContactId}
          onClose={() => setSelectedContactId(null)}
        />
      )}

      {showAddContact && (
        <AddContactModal
          isOpen={showAddContact}
          onClose={() => setShowAddContact(false)}
        />
      )}

      {showImportHelp && (
        <ImportHelpModal
          isOpen={showImportHelp}
          onClose={() => setShowImportHelp(false)}
        />
      )}

      {showTableSettings && (
        <TableSettingsModal
          isOpen={showTableSettings}
          onClose={() => setShowTableSettings(false)}
          onSave={handleTableSettingsSave}
          currentSettings={tableSettings}
        />
      )}
    </div>
  );
}
