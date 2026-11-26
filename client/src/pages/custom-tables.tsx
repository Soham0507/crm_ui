import { useMemo, useState, type ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Table as TableIcon,
  Edit,
  Trash2,
  ArrowLeft,
  Database
} from "lucide-react";
import CustomTableBuilder from "@/components/custom-table-builder";
import CustomTableView from "@/components/custom-table-view";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { CustomTable, CustomTableSummary, CustomTableWithRecords, CustomTableSchema } from "@shared/schema";

function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1 px-6 py-6">{children}</div>
    </div>
  );
}

export default function CustomTables() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [editingTable, setEditingTable] = useState<CustomTable | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tables = [], isLoading } = useQuery<CustomTableSummary[]>({
    queryKey: ['/api/custom-tables'],
  });

  const { data: selectedTableData } = useQuery({
    queryKey: [`/api/custom-tables/${selectedTable}`],
    enabled: !!selectedTable,
  });

  const createTableMutation = useMutation({
    mutationFn: ({ tableName, displayName, schema }: {
      tableName: string;
      displayName: string;
      schema: CustomTableSchema;
    }) => apiRequest('POST', '/api/custom-tables', { 
      tableName, 
      displayName, 
      schema 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tables'] });
      setShowBuilder(false);
      setEditingTable(null);
      toast({
        title: "Table created",
        description: "Your custom table has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create table. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, tableName, displayName, schema }: {
      id: number;
      tableName: string;
      displayName: string;
      schema: CustomTableSchema;
    }) => apiRequest('PATCH', `/api/custom-tables/${id}`, { 
      tableName, 
      displayName, 
      schema 
    }),
    // Take the id from the request: the form has already cleared editingTable.
    onSuccess: (_response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tables'] });
      queryClient.invalidateQueries({ queryKey: [`/api/custom-tables/${id}`] });
      setShowBuilder(false);
      setEditingTable(null);
      toast({
        title: "Table updated",
        description: "Your custom table has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update table. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/custom-tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-tables'] });
      if (selectedTable) {
        setSelectedTable(null);
      }
      toast({
        title: "Table deleted",
        description: "The table has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete table. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveTable = (tableName: string, displayName: string, schema: CustomTableSchema) => {
    if (editingTable) {
      updateTableMutation.mutate({
        id: editingTable.id,
        tableName,
        displayName,
        schema,
      });
    } else {
      createTableMutation.mutate({ tableName, displayName, schema });
    }
  };

  const handleEditTable = (table: CustomTable) => {
    setEditingTable(table);
    setShowBuilder(true);
  };

  const handleDeleteTable = (table: CustomTable) => {
    if (confirm(`Are you sure you want to delete "${table.displayName}"? This action cannot be undone.`)) {
      deleteTableMutation.mutate(table.id);
    }
  };

  const getColumnCount = (table: CustomTable) => {
    const schema = table.schema as any;
    return schema.columns?.length || 0;
  };

  // Memoised because the form reloads whenever this object changes.
  const editingData = useMemo(
    () =>
      editingTable
        ? {
            tableName: editingTable.tableName,
            displayName: editingTable.displayName,
            schema: editingTable.schema as CustomTableSchema,
          }
        : undefined,
    [editingTable],
  );

  // Rendered by both the table list and the open table.
  const tableBuilder = (
    <CustomTableBuilder
      isOpen={showBuilder}
      onClose={() => {
        setShowBuilder(false);
        setEditingTable(null);
      }}
      onSave={handleSaveTable}
      initialData={editingData}
    />
  );

  // If a table is selected, show the table view
  if (selectedTable && selectedTableData) {
    return (
      <PageLayout>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedTable(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tables
          </Button>
        </div>

        <CustomTableView
          table={selectedTableData}
          onEdit={() => handleEditTable(selectedTableData)}
        />
        {tableBuilder}
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Custom Tables</h1>
          <p className="text-gray-600 mt-2">
            Create and manage custom data tables for your CRM
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Table
        </Button>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-[24px] bg-white px-6 py-14 text-center shadow-depth">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2DD4BF,#0F766E)] shadow-[0_6px_0_#0B4F4A,inset_0_2px_0_rgba(255,255,255,0.35)]">
            <Database className="h-8 w-8 text-white" />
          </span>
          <h3 className="text-xl font-extrabold text-ink mb-2">No Custom Tables</h3>
          <p className="text-gray-600 mb-6">
            Create your first custom table to organize your data
          </p>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const schema = table.schema as any;

            return (
              <Card key={table.id} className="cursor-pointer shadow-depth transition-transform duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <TableIcon className="h-5 w-5 mr-2 text-brand" />
                        {table.displayName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getColumnCount(table)} columns • Created {formatDate(table.createdAt!)}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTable(table);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => setSelectedTable(table.id)}>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Columns:</p>
                      <div className="flex flex-wrap gap-1">
                        {(schema.columns || []).slice(0, 3).map((column: any) => (
                          <Badge key={column.id} variant="outline" className="text-xs">
                            {column.name}
                          </Badge>
                        ))}
                        {getColumnCount(table) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{getColumnCount(table) - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {table.recordCount} record{table.recordCount !== 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-brand">
                        View table →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tableBuilder}
    </PageLayout>
  );
}