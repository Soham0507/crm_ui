import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Type, 
  Hash, 
  DollarSign, 
  Calendar, 
  List, 
  ToggleLeft, 
  Mail, 
  Phone,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColumnField {
  name: string;
  type: 'text' | 'longtext' | 'number' | 'currency' | 'date' | 'dropdown' | 'boolean' | 'email' | 'phone';
  options?: string[];
  defaultValue?: any;
}

interface DynamicColumnBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (column: ColumnField) => void;
}

const fieldTypeIcons = {
  text: Type,
  longtext: FileText,
  number: Hash,
  currency: DollarSign,
  date: Calendar,
  dropdown: List,
  boolean: ToggleLeft,
  email: Mail,
  phone: Phone,
};

const fieldTypeLabels = {
  text: 'Short Text',
  longtext: 'Long Text',
  number: 'Number',
  currency: 'Currency',
  date: 'Date',
  dropdown: 'Dropdown',
  boolean: 'Checkbox',
  email: 'Email',
  phone: 'Phone',
};

export default function DynamicColumnBuilder({ isOpen, onClose, onSave }: DynamicColumnBuilderProps) {
  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState<ColumnField['type']>('text');
  const [dropdownOptions, setDropdownOptions] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    if (!columnName.trim()) {
      toast({
        title: "Error",
        description: "Column name is required.",
        variant: "destructive",
      });
      return;
    }

    const column: ColumnField = {
      name: columnName.trim(),
      type: columnType,
      defaultValue: defaultValue || undefined,
    };

    if (columnType === 'dropdown' && dropdownOptions.trim()) {
      column.options = dropdownOptions.split(',').map(opt => opt.trim()).filter(Boolean);
    }

    onSave(column);
    handleClose();
  };

  const handleClose = () => {
    setColumnName("");
    setColumnType('text');
    setDropdownOptions("");
    setDefaultValue("");
    onClose();
  };

  const isValid = columnName.trim() && 
                  (columnType !== 'dropdown' || dropdownOptions.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Column Name */}
          <div>
            <Label htmlFor="columnName">Column Name</Label>
            <Input
              id="columnName"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="e.g., Meeting Notes"
            />
          </div>

          {/* Column Type */}
          <div>
            <Label htmlFor="columnType">Field Type</Label>
            <Select value={columnType} onValueChange={(value) => setColumnType(value as ColumnField['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fieldTypeLabels).map(([value, label]) => {
                  const Icon = fieldTypeIcons[value as keyof typeof fieldTypeIcons];
                  return (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Dropdown Options */}
          {columnType === 'dropdown' && (
            <div>
              <Label htmlFor="dropdownOptions">Options</Label>
              <Input
                id="dropdownOptions"
                value={dropdownOptions}
                onChange={(e) => setDropdownOptions(e.target.value)}
                placeholder="Option 1, Option 2, Option 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate options with commas
              </p>
            </div>
          )}

          {/* Default Value */}
          <div>
            <Label htmlFor="defaultValue">Default Value (Optional)</Label>
            {columnType === 'longtext' ? (
              <Textarea
                id="defaultValue"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Default content..."
                rows={3}
              />
            ) : (
              <Input
                id="defaultValue"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Default value"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid}>
              Add Column
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}