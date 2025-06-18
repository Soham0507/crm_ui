import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  DollarSign,
  Check,
  X,
  MoreVertical
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { format } from "date-fns";
import type { CustomTableWithRecords, TableColumn, CustomTableRecord } from "@shared/schema";

interface CustomTableViewProps {
  table: CustomTableWithRecords;
  onEdit: () => void;
}

export default function CustomTableView({ table, onEdit }: CustomTableViewProps) {
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecordData, setNewRecordData] = useState<any>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRecordMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', `/api/custom-tables/${table.id}/records`, { data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-tables/${table.id}`] });
      setIsAddingRecord(false);
      setNewRecordData({});
      toast({
        title: "Record created",
        description: "New record has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest('PATCH', `/api/custom-tables/${table.id}/records/${id}`, { data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-tables/${table.id}`] });
      setEditingRecord(null);
      setEditingData({});
      toast({
        title: "Record updated",
        description: "Record has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/custom-tables/${table.id}/records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-tables/${table.id}`] });
      toast({
        title: "Record deleted",
        description: "Record has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const schema = table.schema as any;
  const columns: TableColumn[] = schema.columns || [];

  const startAddingRecord = () => {
    const initialData: any = {};
    columns.forEach(column => {
      if (column.defaultValue !== undefined) {
        initialData[column.id] = column.defaultValue;
      } else {
        switch (column.type) {
          case 'boolean':
            initialData[column.id] = false;
            break;
          case 'number':
          case 'currency':
            initialData[column.id] = 0;
            break;
          default:
            initialData[column.id] = '';
        }
      }
    });
    setNewRecordData(initialData);
    setIsAddingRecord(true);
  };

  const startEditingRecord = (record: CustomTableRecord) => {
    setEditingRecord(record.id);
    setEditingData(record.data);
  };

  const saveRecord = () => {
    if (isAddingRecord) {
      createRecordMutation.mutate(newRecordData);
    } else if (editingRecord) {
      updateRecordMutation.mutate({
        id: editingRecord,
        data: editingData
      });
    }
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setEditingData({});
    setIsAddingRecord(false);
    setNewRecordData({});
  };

  const renderCellValue = (column: TableColumn, value: any, isEditing = false, onChange?: (value: any) => void) => {
    if (isEditing && onChange) {
      return renderEditableCell(column, value, onChange);
    }

    switch (column.type) {
      case 'currency':
        return formatCurrency(value || 0);
      case 'date':
        return value ? formatDate(value) : '-';
      case 'boolean':
        return <Checkbox checked={Boolean(value)} readOnly />;
      case 'dropdown':
        return value ? <Badge variant="secondary">{value}</Badge> : '-';
      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : '-';
      case 'phone':
        return value ? (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : '-';
      default:
        return value || '-';
    }
  };

  const renderEditableCell = (column: TableColumn, value: any, onChange: (value: any) => void) => {
    switch (column.type) {
      case 'dropdown':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(column.options || []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'currency':
      case 'number':
        return (
          <div className="relative">
            {column.type === 'currency' && (
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className={column.type === 'currency' ? "pl-9" : ""}
              step={column.type === 'currency' ? "0.01" : "1"}
            />
          </div>
        );

      case 'boolean':
        return (
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            type={column.type === 'email' ? 'email' : column.type === 'phone' ? 'tel' : 'text'}
          />
        );
    }
  };

  const currentData = isAddingRecord ? newRecordData : editingData;
  const setCurrentData = isAddingRecord ? setNewRecordData : setEditingData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{table.displayName}</h2>
          <p className="text-gray-600">
            {table.records.length} record{table.records.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-2">
          {schema.settings?.allowAdd && (
            <Button onClick={startAddingRecord} disabled={isAddingRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          )}
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Table
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id}>
                  <div className="flex items-center space-x-1">
                    <span>{column.name}</span>
                    {column.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add new record row */}
            {isAddingRecord && (
              <TableRow className="bg-blue-50">
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {renderCellValue(
                      column,
                      currentData[column.id],
                      true,
                      (value) => setCurrentData({ ...currentData, [column.id]: value })
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      onClick={saveRecord}
                      disabled={createRecordMutation.isPending}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Existing records */}
            {table.records.map((record) => (
              <TableRow key={record.id}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {renderCellValue(
                      column,
                      editingRecord === record.id ? currentData[column.id] : record.data[column.id],
                      editingRecord === record.id,
                      (value) => setCurrentData({ ...currentData, [column.id]: value })
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {editingRecord === record.id ? (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={saveRecord}
                        disabled={updateRecordMutation.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex space-x-1">
                      {schema.settings?.allowEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingRecord(record)}
                          disabled={editingRecord !== null || isAddingRecord}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {schema.settings?.allowDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this record?')) {
                              deleteRecordMutation.mutate(record.id);
                            }
                          }}
                          disabled={deleteRecordMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {table.records.length === 0 && !isAddingRecord && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8">
                  <div className="text-gray-500">
                    <p>No records found.</p>
                    {schema.settings?.allowAdd && (
                      <Button
                        variant="link"
                        onClick={startAddingRecord}
                        className="mt-2"
                      >
                        Add your first record
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}