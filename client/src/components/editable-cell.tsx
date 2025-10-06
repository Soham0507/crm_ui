import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type FieldType = 'text' | 'email' | 'phone' | 'currency' | 'select' | 'date' | 'tags' | 'boolean';

interface EditableCellProps {
  value: any;
  type: FieldType;
  options?: string[];
  onSave: (value: any) => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
}

export default function EditableCell({
  value,
  type,
  options = [],
  onSave,
  onCancel,
  placeholder,
  className
}: EditableCellProps) {
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value && type === 'date' ? new Date(value) : undefined
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChanges = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current && ['text', 'email', 'phone', 'currency'].includes(type)) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, type]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = (forceExit = true) => {
    let finalValue = editValue;
    
    if (type === 'currency') {
      finalValue = parseFloat(editValue) || 0;
    } else if (type === 'date' && selectedDate) {
      finalValue = selectedDate.toISOString();
    } else if (type === 'tags' && typeof editValue === 'string') {
      finalValue = editValue.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    
    // Only save if value actually changed
    if (JSON.stringify(finalValue) !== JSON.stringify(value)) {
      onSave(finalValue);
      hasChanges.current = false;
    }
    
    if (forceExit) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setSelectedDate(value && type === 'date' ? new Date(value) : undefined);
    setIsEditing(false);
    hasChanges.current = false;
    onCancel();
  };

  const handleBlur = () => {
    // Auto-save on blur for better UX
    if (hasChanges.current) {
      handleSave(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleInputChange = (newValue: any) => {
    setEditValue(newValue);
    hasChanges.current = true;
  };

  const renderDisplayValue = () => {
    switch (type) {
      case 'currency':
        return <span className="font-medium">{formatCurrency(value || 0)}</span>;
      case 'date':
        return value ? (
          <span className="text-sm">{formatDate(value)}</span>
        ) : (
          <span className="text-gray-400 text-sm">No date</span>
        );
      case 'select':
        if (options.includes('lead') || options.includes('qualified')) { // Status field
          return (
            <Badge className={getStatusColor(value)}>
              {getStatusLabel(value)}
            </Badge>
          );
        }
        return <span>{value || 'Not set'}</span>;
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(value) && value.length > 0 ? (
              value.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No tags</span>
            )}
            {Array.isArray(value) && value.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{value.length - 2}
              </Badge>
            )}
          </div>
        );
      case 'boolean':
        return (
          <Checkbox 
            checked={Boolean(value)} 
            readOnly
            className="pointer-events-none"
          />
        );
      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : (
          <span className="text-gray-400">No email</span>
        );
      case 'phone':
        return value ? (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : (
          <span className="text-gray-400">No phone</span>
        );
      default:
        return <span>{value || placeholder || 'Click to edit'}</span>;
    }
  };

  const renderEditField = () => {
    switch (type) {
      case 'select':
        return (
          <Select 
            value={editValue} 
            onValueChange={(newValue) => {
              handleInputChange(newValue);
              // Auto-save on select change
              setEditValue(newValue);
              onSave(newValue);
              setIsEditing(false);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {getStatusLabel(option)}
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
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'currency':
        return (
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className="pl-9"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        );

      case 'tags':
        return (
          <Input
            ref={inputRef}
            value={Array.isArray(editValue) ? editValue.join(', ') : editValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            placeholder="Enter tags separated by commas"
          />
        );

      case 'boolean':
        return (
          <Checkbox
            checked={Boolean(editValue)}
            onCheckedChange={(checked) => {
              handleInputChange(checked);
              // Auto-save checkbox immediately
              onSave(checked);
              setIsEditing(false);
            }}
          />
        );

      default:
        return (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            type={type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'text'}
          />
        );
    }
  };

  if (isEditing) {
    return (
      <div className="min-w-0">
        {renderEditField()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors min-h-[40px] flex items-center",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      {renderDisplayValue()}
    </div>
  );
}