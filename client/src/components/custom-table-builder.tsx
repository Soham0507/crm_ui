import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Type,
  Hash,
  DollarSign,
  Calendar,
  List,
  ToggleLeft,
  Mail,
  Phone
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { TableColumn, CustomTableSchema } from "@shared/schema";

interface CustomTableBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tableName: string, displayName: string, schema: CustomTableSchema) => void;
  initialData?: {
    tableName: string;
    displayName: string;
    schema: CustomTableSchema;
  };
}

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  currency: DollarSign,
  date: Calendar,
  dropdown: List,
  boolean: ToggleLeft,
  email: Mail,
  phone: Phone,
};

const fieldTypeLabels = {
  text: 'Text',
  number: 'Number',
  currency: 'Currency',
  date: 'Date',
  dropdown: 'Dropdown',
  boolean: 'Boolean',
  email: 'Email',
  phone: 'Phone',
};

export default function CustomTableBuilder({
  isOpen,
  onClose,
  onSave,
  initialData
}: CustomTableBuilderProps) {
  const [tableName, setTableName] = useState(initialData?.tableName || '');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [columns, setColumns] = useState<TableColumn[]>(
    initialData?.schema.columns || [
      { id: uuidv4(), name: 'Name', type: 'text', required: true }
    ]
  );
  const [settings, setSettings] = useState(
    initialData?.schema.settings || {
      allowAdd: true,
      allowEdit: true,
      allowDelete: true,
    }
  );

  const addColumn = () => {
    const newColumn: TableColumn = {
      id: uuidv4(),
      name: '',
      type: 'text',
      required: false,
    };
    setColumns([...columns, newColumn]);
  };

  const updateColumn = (id: string, updates: Partial<TableColumn>) => {
    setColumns(columns.map(col => 
      col.id === id ? { ...col, ...updates } : col
    ));
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return; // Keep at least one column
    setColumns(columns.filter(col => col.id !== id));
  };

  const addDropdownOption = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column && column.type === 'dropdown') {
      const options = column.options || [];
      updateColumn(columnId, { 
        options: [...options, ''] 
      });
    }
  };

  const updateDropdownOption = (columnId: string, optionIndex: number, value: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column && column.options) {
      const newOptions = [...column.options];
      newOptions[optionIndex] = value;
      updateColumn(columnId, { options: newOptions });
    }
  };

  const removeDropdownOption = (columnId: string, optionIndex: number) => {
    const column = columns.find(col => col.id === columnId);
    if (column && column.options && column.options.length > 1) {
      const newOptions = column.options.filter((_, index) => index !== optionIndex);
      updateColumn(columnId, { options: newOptions });
    }
  };

  const generateTableName = (display: string) => {
    return display
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (!tableName || tableName === generateTableName(displayName)) {
      setTableName(generateTableName(value));
    }
  };

  const handleSave = () => {
    if (!displayName.trim() || !tableName.trim() || columns.length === 0) {
      return;
    }

    // Validate columns
    const validColumns = columns.filter(col => col.name.trim());
    if (validColumns.length === 0) {
      return;
    }

    const schema: CustomTableSchema = {
      columns: validColumns,
      settings,
    };

    onSave(tableName, displayName, schema);
    onClose();
  };

  const isValid = displayName.trim() && tableName.trim() && 
                  columns.some(col => col.name.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Custom Table' : 'Create Custom Table'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Table Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                placeholder="e.g., VC Firms"
              />
            </div>
            <div>
              <Label htmlFor="tableName">Table Name (Internal)</Label>
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., vc_firms"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lowercase, underscores only
              </p>
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Columns</h3>
              <Button onClick={addColumn} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>

            <div className="space-y-4">
              {columns.map((column, index) => {
                const Icon = fieldTypeIcons[column.type];
                return (
                  <div key={column.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="mt-2">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Column name and type */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Column Name</Label>
                            <Input
                              value={column.name}
                              onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                              placeholder="Enter column name"
                            />
                          </div>
                          <div>
                            <Label>Field Type</Label>
                            <Select
                              value={column.type}
                              onValueChange={(value: any) => {
                                const updates: Partial<TableColumn> = { type: value };
                                if (value === 'dropdown' && !column.options) {
                                  updates.options = ['Option 1'];
                                }
                                updateColumn(column.id, updates);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(fieldTypeLabels).map(([value, label]) => {
                                  const IconComponent = fieldTypeIcons[value as keyof typeof fieldTypeIcons];
                                  return (
                                    <SelectItem key={value} value={value}>
                                      <div className="flex items-center">
                                        <IconComponent className="h-4 w-4 mr-2" />
                                        {label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Column options */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${column.id}`}
                              checked={column.required}
                              onCheckedChange={(checked) => 
                                updateColumn(column.id, { required: checked as boolean })
                              }
                            />
                            <Label htmlFor={`required-${column.id}`} className="text-sm">
                              Required
                            </Label>
                          </div>

                          <Badge variant="outline" className="flex items-center">
                            <Icon className="h-3 w-3 mr-1" />
                            {fieldTypeLabels[column.type]}
                          </Badge>
                        </div>

                        {/* Dropdown options */}
                        {column.type === 'dropdown' && (
                          <div>
                            <Label className="text-sm">Dropdown Options</Label>
                            <div className="space-y-2 mt-2">
                              {(column.options || []).map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateDropdownOption(column.id, optionIndex, e.target.value)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDropdownOption(column.id, optionIndex)}
                                    disabled={(column.options?.length || 0) <= 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addDropdownOption(column.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColumn(column.id)}
                        disabled={columns.length <= 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Table Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowAdd"
                  checked={settings.allowAdd}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, allowAdd: checked as boolean })
                  }
                />
                <Label htmlFor="allowAdd">Allow adding new records</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowEdit"
                  checked={settings.allowEdit}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, allowEdit: checked as boolean })
                  }
                />
                <Label htmlFor="allowEdit">Allow editing records</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowDelete"
                  checked={settings.allowDelete}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, allowDelete: checked as boolean })
                  }
                />
                <Label htmlFor="allowDelete">Allow deleting records</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {initialData ? 'Update Table' : 'Create Table'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}