import { useState, useRef, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Filter, X, Search } from "lucide-react";
import { formatCurrency, getStatusLabel, getStatusColor } from "@/lib/utils";
import type { Contact } from "@shared/schema";

interface ColumnFilterProps {
  column: string;
  label: string;
  contacts: Contact[];
  activeFilters: any;
  onFilterChange: (column: string, value: any) => void;
}

export default function ColumnFilter({
  column,
  label,
  contacts,
  activeFilters,
  onFilterChange
}: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(activeFilters[column] || [])
  );

  // Get unique values for this column
  const getUniqueValues = () => {
    const values = new Set<string>();
    
    contacts.forEach(contact => {
      const value = contact[column as keyof Contact];
      
      if (column === 'tags' && Array.isArray(value)) {
        value.forEach(tag => values.add(tag));
      } else if (column === 'dealValue') {
        // Group deal values into ranges
        const numValue = Number(value) || 0;
        if (numValue === 0) values.add('$0');
        else if (numValue < 1000) values.add('< $1k');
        else if (numValue < 5000) values.add('$1k - $5k');
        else if (numValue < 10000) values.add('$5k - $10k');
        else if (numValue < 50000) values.add('$10k - $50k');
        else values.add('$50k+');
      } else if (column === 'phone' || column === 'email') {
        // For phone/email, just check if it exists
        if (value) values.add('Has ' + label);
        else values.add('No ' + label);
      } else if (value !== null && value !== undefined) {
        values.add(String(value));
      }
    });
    
    return Array.from(values).sort();
  };

  const uniqueValues = getUniqueValues();
  const filteredValues = uniqueValues.filter(value =>
    value.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelectValue = (value: string, checked: boolean) => {
    const newSelected = new Set(selectedValues);
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    setSelectedValues(newSelected);
  };

  const handleApply = () => {
    if (selectedValues.size > 0) {
      onFilterChange(column, Array.from(selectedValues));
    } else {
      onFilterChange(column, null);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedValues(new Set());
    onFilterChange(column, null);
    setOpen(false);
  };

  const hasActiveFilter = activeFilters[column] && activeFilters[column].length > 0;

  const renderValue = (value: string) => {
    if (column === 'status') {
      return (
        <Badge className={getStatusColor(value)}>
          {getStatusLabel(value)}
        </Badge>
      );
    }
    if (column === 'tags') {
      return (
        <Badge variant="secondary" className="text-xs">
          {value}
        </Badge>
      );
    }
    return <span>{value}</span>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${hasActiveFilter ? 'text-requisor-turquoise' : ''}`}
        >
          <Filter className={`h-3 w-3 mr-1 ${hasActiveFilter ? 'fill-requisor-turquoise' : ''}`} />
          {label}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Filter {label}</h4>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
          </div>
          {filteredValues.length > 5 && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-8 pl-7 text-sm"
              />
            </div>
          )}
        </div>
        
        <div className="max-h-64 overflow-y-auto p-2">
          {filteredValues.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">
              No values found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredValues.map(value => (
                <label
                  key={value}
                  className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues.has(value)}
                    onCheckedChange={(checked) => handleSelectValue(value, checked as boolean)}
                  />
                  <span className="text-sm flex-1">{renderValue(value)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="p-2 flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}