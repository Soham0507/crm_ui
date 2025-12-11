import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import GridView from "@/components/grid-view";
import PipelineView from "@/components/pipeline-view";
import ContactDetailsSidebar from "@/components/contact-details-sidebar";
import AddContactModal from "@/components/add-contact-modal";
import ImportHelpModal from "@/components/import-help-modal";
import ImportLoadingModal from "@/components/import-loading-modal";
import TableSettingsModal, {
  type TableSettings,
} from "@/components/table-settings-modal";
import AdvancedFilters, {
  type FilterCriteria,
} from "@/components/advanced-filters";
import AIInsightsPanel from "@/components/ai-insights-panel";
import DynamicColumnBuilder from "@/components/dynamic-column-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Columns,
  Users,
  TrendingUp,
  HelpCircle,
  Settings,
} from "lucide-react";
import type { Contact } from "@shared/schema";
import { CSVImporter } from "@importcsv/react";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<"grid" | "pipeline">("grid");
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null,
  );
  const [showAddContact, setShowAddContact] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnBuilder, setShowColumnBuilder] = useState(false);
  const [importingCount, setImportingCount] = useState<number>(0);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [filters, setFilters] = useState<FilterCriteria>({
    search: "",
    statuses: [],
    dealValueMin: null,
    dealValueMax: null,
    dateRange: { from: null, to: null },
    tags: [],
    companies: [],
    hasPhone: null,
    hasNotes: null,
  });
  const [tableSettings, setTableSettings] = useState<TableSettings>(() => {
    const saved = localStorage.getItem("crm-table-settings");
    return saved
      ? JSON.parse(saved)
      : {
          columns: [
            { key: "name", label: "Name & Company", visible: true },
            { key: "status", label: "Status", visible: true },
            { key: "email", label: "Email", visible: true },
            { key: "phone", label: "Phone", visible: true },
            { key: "dealValue", label: "Deal Value", visible: true },
            { key: "tags", label: "Tags", visible: true },
            { key: "createdAt", label: "Created Date", visible: false },
            { key: "updatedAt", label: "Updated Date", visible: false },
          ],
          pageSize: 50,
          autoSave: true,
        };
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: stats = {} } = useQuery<any>({
    queryKey: ["/api/pipeline/stats"],
  });

  const handleColumnFilterChange = (column: string, value: any) => {
    setColumnFilters((prev) => {
      if (
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        const { [column]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [column]: value };
    });
  };

  const filteredContacts = contacts.filter((contact) => {
    // Column-specific filters
    for (const [column, filterValues] of Object.entries(columnFilters)) {
      if (
        !filterValues ||
        (Array.isArray(filterValues) && filterValues.length === 0)
      )
        continue;

      const contactValue = contact[column as keyof Contact];

      // Handle different column types
      if (column === "tags") {
        const contactTags = (contactValue as string[]) || [];
        const hasMatchingTag = filterValues.some((filterTag: string) =>
          contactTags.includes(filterTag),
        );
        if (!hasMatchingTag) return false;
      } else if (column === "dealValue") {
        const numValue = Number(contactValue) || 0;
        const hasMatchingRange = filterValues.some((range: string) => {
          if (range === "$0") return numValue === 0;
          if (range === "< $1k") return numValue > 0 && numValue < 1000;
          if (range === "$1k - $5k") return numValue >= 1000 && numValue < 5000;
          if (range === "$5k - $10k")
            return numValue >= 5000 && numValue < 10000;
          if (range === "$10k - $50k")
            return numValue >= 10000 && numValue < 50000;
          if (range === "$50k+") return numValue >= 50000;
          return false;
        });
        if (!hasMatchingRange) return false;
      } else if (column === "phone" || column === "email") {
        const hasValue = !!contactValue;
        const matchesFilter = filterValues.some((filterValue: string) => {
          if (filterValue === `Has ${column === "phone" ? "Phone" : "Email"}`)
            return hasValue;
          if (filterValue === `No ${column === "phone" ? "Phone" : "Email"}`)
            return !hasValue;
          return false;
        });
        if (!matchesFilter) return false;
      } else {
        // For other columns, check if the value matches any of the filter values
        if (!filterValues.includes(String(contactValue))) return false;
      }
    }

    // Basic search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const matchesSearch =
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.status.toLowerCase().includes(query) ||
        contact.tags?.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter (from advanced filters)
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(contact.status)
    ) {
      return false;
    }

    // Deal value range (from advanced filters)
    const dealValue = contact.dealValue || 0;
    if (filters.dealValueMin !== null && dealValue < filters.dealValueMin) {
      return false;
    }
    if (filters.dealValueMax !== null && dealValue > filters.dealValueMax) {
      return false;
    }

    // Date range
    if (filters.dateRange.from && contact.createdAt) {
      const contactDate = new Date(contact.createdAt);
      if (contactDate < filters.dateRange.from) return false;
    }
    if (filters.dateRange.to && contact.createdAt) {
      const contactDate = new Date(contact.createdAt);
      if (contactDate > filters.dateRange.to) return false;
    }

    // Tags filter (from advanced filters)
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some((tag) =>
        contact.tags?.includes(tag),
      );
      if (!hasMatchingTag) return false;
    }

    // Companies filter
    if (filters.companies.length > 0 && contact.company) {
      if (!filters.companies.includes(contact.company)) return false;
    }

    // Additional criteria
    if (filters.hasPhone === true && !contact.phone) return false;

    return true;
  });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/contacts/export", {
        credentials: "include",
        headers: {
          Accept: "text/csv",
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contacts.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export completed",
        description: "Contacts have been exported successfully.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "Failed to export contacts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const { mutate: importContacts, isPending: isImporting } = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await fetch("/api/contacts/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Import failed" }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/stats"] });
      toast({
        title: "Import completed",
        description:
          result.message || `Successfully imported ${result.created} contacts`,
      });
      if (result.errors && result.errors.length > 0) {
        console.warn("Import warnings:", result.errors);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description:
          error.message ||
          "Failed to import contacts. Please check your CSV file format.",
        variant: "destructive",
      });
    },
  });

  const handleImport = (data: any[]) => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to import",
        description: "Please provide valid Contact data.",
        variant: "destructive",
      });
      return;
    }

    setImportingCount(data.length);
    importContacts(data);
  };

  const handleTableSettingsSave = (newSettings: TableSettings) => {
    setTableSettings(newSettings);
    if (newSettings.autoSave) {
      localStorage.setItem("crm-table-settings", JSON.stringify(newSettings));
    }
    toast({
      title: "Settings saved",
      description: "Your table preferences have been updated.",
    });
  };

  const handleColumnSave = (column: any) => {
    // In a real app, this would save the column configuration to the database
    const newColumn = {
      key: column.name.toLowerCase().replace(/\s+/g, "_"),
      label: column.name,
      visible: true,
      type: column.type,
      options: column.options,
      defaultValue: column.defaultValue,
    };

    const updatedSettings = {
      ...tableSettings,
      columns: [...tableSettings.columns, newColumn],
    };

    setTableSettings(updatedSettings);
    if (updatedSettings.autoSave) {
      localStorage.setItem(
        "crm-table-settings",
        JSON.stringify(updatedSettings),
      );
    }

    toast({
      title: "Column added",
      description: `Added ${column.name} column to your table.`,
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
                  {currentView === "grid" ? "Grid View" : "Pipeline View"}
                </h2>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-requisor-light text-requisor-turquoise"
                  >
                    <div className="w-1.5 h-1.5 mr-1.5 bg-requisor-turquoise rounded-full"></div>
                    <Users className="h-3 w-3 mr-1" />
                    {stats?.totalContacts || 0} Contacts
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-requisor-light text-requisor-turquoise"
                  >
                    <div className="w-1.5 h-1.5 mr-1.5 bg-requisor-turquoise rounded-full"></div>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stats?.activeDeals || 0} Active Deals
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowColumnBuilder(true)}
                  className="border-requisor-turquoise/20 text-requisor-turquoise hover:bg-requisor-light"
                >
                  <Columns className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search contacts, deals..."
                    className="pl-10 w-64"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Filters & Settings */}
                <div className="flex items-center gap-2">
                  {Object.keys(columnFilters).length > 0 && (
                    <>
                      <Badge
                        variant="secondary"
                        className="bg-requisor-turquoise/10 text-requisor-turquoise"
                      >
                        {Object.keys(columnFilters).length} column filter
                        {Object.keys(columnFilters).length > 1 ? "s" : ""}
                      </Badge>
                      <Button
                        onClick={() => setColumnFilters({})}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Clear
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(true)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {(filters.statuses.length > 0 ||
                      filters.tags.length > 0 ||
                      filters.companies.length > 0 ||
                      filters.dealValueMin ||
                      filters.dealValueMax ||
                      filters.dateRange.from ||
                      filters.dateRange.to ||
                      filters.hasPhone ||
                      filters.hasNotes) && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-4 w-4 p-0 text-xs"
                      >
                        {[
                          filters.statuses.length,
                          filters.tags.length,
                          filters.companies.length,
                          filters.dealValueMin ? 1 : 0,
                          filters.dealValueMax ? 1 : 0,
                          filters.dateRange.from ? 1 : 0,
                          filters.dateRange.to ? 1 : 0,
                          filters.hasPhone ? 1 : 0,
                          filters.hasNotes ? 1 : 0,
                        ].reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                  </Button>
                </div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isImporting}
                      onClick={() => setShowImportModal(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
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
                <Button
                  onClick={() => setShowAddContact(true)}
                  className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto bg-gray-50">
            {currentView === "grid" ? (
              <GridView
                contacts={filteredContacts as Contact[]}
                onContactSelect={setSelectedContactId}
                tableSettings={tableSettings}
                columnFilters={columnFilters}
                onColumnFilterChange={handleColumnFilterChange}
              />
            ) : (
              <PipelineView
                contacts={filteredContacts as Contact[]}
                onContactSelect={setSelectedContactId}
              />
            )}
          </div>

          {/* AI Insights Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-white overflow-auto">
            <AIInsightsPanel
              contactId={selectedContactId || undefined}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Contact Details Sidebar */}
      <ContactDetailsSidebar
        contactId={selectedContactId}
        isOpen={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />

      {/* We're using the deprecated `columns` property due to a package dependency issue.
          Once resolved, switch to `schema` instead.
          https://github.com/importcsv/importcsv/issues/13 */}
      <CSVImporter
        modalIsOpen={showImportModal}
        modalOnCloseTriggered={() => setShowImportModal(false)}
        columns={[
          {
            id: "name",
            label: "Full Name",
            type: "string",
            validators: [{ type: "required" }],
          },
          {
            id: "email",
            label: "Email",
            type: "email",
            validators: [{ type: "required" }],
          },
          {
            id: "phone",
            label: "Phone",
            type: "phone",
            transformations: [{ type: "normalize_phone" }],
          },
          {
            id: "company",
            label: "Company",
            type: "string",
          },
          {
            id: "status",
            label: "Status",
            type: "string",
            options: [
              "lead",
              "qualified",
              "proposal",
              "closed-won",
              "closed-lost",
            ],
            transformations: [
              {
                type: "default",
                value: "lead",
              },
            ],
          },
        ]}
        onComplete={(data) => {
          const contacts = data.mappedData.map((row: any) => row.data);

          handleImport(contacts);

          setShowImportModal(false);
        }}
      />

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

      {showAdvancedFilters && (
        <AdvancedFilters
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
          contacts={contacts}
        />
      )}

      {showColumnBuilder && (
        <DynamicColumnBuilder
          isOpen={showColumnBuilder}
          onClose={() => setShowColumnBuilder(false)}
          onSave={handleColumnSave}
        />
      )}

      <ImportLoadingModal isOpen={isImporting} contactCount={importingCount} />
    </div>
  );
}
