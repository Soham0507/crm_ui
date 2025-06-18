import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import GridView from "@/components/grid-view";
import PipelineView from "@/components/pipeline-view";
import ContactModal from "@/components/contact-modal";
import AddContactModal from "@/components/add-contact-modal";
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
  TrendingUp
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Contact } from "@shared/schema";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<'grid' | 'pipeline'>('grid');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/contacts/import', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(result => {
        console.log('Import result:', result);
        // Refresh contacts list
        window.location.reload();
      })
      .catch(error => {
        console.error('Import failed:', error);
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

                {/* Filters */}
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>

                {/* Import/Export */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleImport}
                      />
                    </label>
                  </Button>
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
    </div>
  );
}
