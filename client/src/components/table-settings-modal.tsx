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
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from "lucide-react";

interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
  width?: number;
}

interface TableSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: TableSettings) => void;
  currentSettings: TableSettings;
}

export interface TableSettings {
  columns: TableColumn[];
  pageSize: number;
  autoSave: boolean;
}

const defaultColumns: TableColumn[] = [
  { key: 'name', label: 'Name & Company', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'phone', label: 'Phone', visible: true },
  { key: 'dealValue', label: 'Deal Value', visible: true },
  { key: 'tags', label: 'Tags', visible: true },
  { key: 'createdAt', label: 'Created Date', visible: false },
  { key: 'updatedAt', label: 'Updated Date', visible: false },
];

export default function TableSettingsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentSettings 
}: TableSettingsModalProps) {
  const [settings, setSettings] = useState<TableSettings>(currentSettings);

  const handleColumnToggle = (columnKey: string, visible: boolean) => {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.key === columnKey ? { ...col, visible } : col
      )
    }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSettings(prev => ({ ...prev, pageSize }));
  };

  const handleAutoSaveToggle = (autoSave: boolean) => {
    setSettings(prev => ({ ...prev, autoSave }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({
      columns: defaultColumns,
      pageSize: 10,
      autoSave: true,
    });
  };

  const visibleColumns = settings.columns.filter(col => col.visible).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Table Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Column Visibility */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Column Visibility</Label>
              <Badge variant="secondary" className="text-xs">
                {visibleColumns} of {settings.columns.length} visible
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {settings.columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={column.key}
                    checked={column.visible}
                    onCheckedChange={(checked) => 
                      handleColumnToggle(column.key, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={column.key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                  >
                    {column.label}
                  </label>
                  {column.visible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
            
            {visibleColumns < 2 && (
              <p className="text-xs text-amber-600 mt-2">
                At least 2 columns must be visible
              </p>
            )}
          </div>

          {/* Page Size */}
          <div>
            <Label htmlFor="pageSize" className="text-sm font-medium mb-3 block">
              Rows per page
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map((size) => (
                <Button
                  key={size}
                  variant={settings.pageSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageSizeChange(size)}
                  className="text-xs"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Auto Save */}
          <div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="autoSave"
                checked={settings.autoSave}
                onCheckedChange={handleAutoSaveToggle}
              />
              <div>
                <label
                  htmlFor="autoSave"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Auto-save table preferences
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Remember your settings for next time
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={visibleColumns < 2}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}