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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  DollarSign,
  Tag,
  Building,
  RotateCcw
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import type { Contact } from "@shared/schema";

export interface FilterCriteria {
  search: string;
  statuses: string[];
  dealValueMin: number | null;
  dealValueMax: number | null;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  tags: string[];
  companies: string[];
  hasPhone: boolean | null;
  hasNotes: boolean | null;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  contacts: Contact[];
}

const statusOptions = [
  { value: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
  { value: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
];

export default function AdvancedFilters({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  contacts 
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterCriteria>(filters);

  // Extract unique tags and companies from contacts
  const allTags = Array.from(new Set(
    contacts.flatMap(contact => contact.tags || [])
  )).sort();
  
  const allCompanies = Array.from(new Set(
    contacts.map(contact => contact.company).filter(Boolean)
  )).sort();

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterCriteria = {
      search: '',
      statuses: [],
      dealValueMin: null,
      dealValueMax: null,
      dateRange: { from: null, to: null },
      tags: [],
      companies: [],
      hasPhone: null,
      hasNotes: null,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const handleStatusToggle = (status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const handleTagToggle = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleCompanyToggle = (company: string) => {
    setLocalFilters(prev => ({
      ...prev,
      companies: prev.companies.includes(company)
        ? prev.companies.filter(c => c !== company)
        : [...prev.companies, company]
    }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.statuses.length > 0) count++;
    if (localFilters.dealValueMin || localFilters.dealValueMax) count++;
    if (localFilters.dateRange.from || localFilters.dateRange.to) count++;
    if (localFilters.tags.length > 0) count++;
    if (localFilters.companies.length > 0) count++;
    if (localFilters.hasPhone !== null) count++;
    if (localFilters.hasNotes !== null) count++;
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Advanced Filters
            </DialogTitle>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} active filter{getActiveFilterCount() !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              placeholder="Search contacts, companies, emails..."
              value={localFilters.search}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Deal Value Range */}
          <div className="space-y-2">
            <Label>Deal Value Range</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Min"
                  className="pl-9"
                  value={localFilters.dealValueMin || ''}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    dealValueMin: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Max"
                  className="pl-9"
                  value={localFilters.dealValueMax || ''}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    dealValueMax: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <Badge
                  key={status.value}
                  variant={localFilters.statuses.includes(status.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    localFilters.statuses.includes(status.value) 
                      ? status.color 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => handleStatusToggle(status.value)}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Created Date Range</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !localFilters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.from ? (
                      format(localFilters.dateRange.from, "PPP")
                    ) : (
                      "From date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.from || undefined}
                    onSelect={(date) => setLocalFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: date || null }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !localFilters.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.to ? (
                      format(localFilters.dateRange.to, "PPP")
                    ) : (
                      "To date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.to || undefined}
                    onSelect={(date) => setLocalFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: date || null }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {allTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={localFilters.tags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <label
                    htmlFor={`tag-${tag}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag}
                  </label>
                </div>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-gray-500">No tags found</p>
              )}
            </div>
          </div>

          {/* Companies Filter */}
          <div className="space-y-3">
            <Label>Companies</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {allCompanies.map((company) => (
                <div key={company} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company}`}
                    checked={localFilters.companies.includes(company)}
                    onCheckedChange={() => handleCompanyToggle(company)}
                  />
                  <label
                    htmlFor={`company-${company}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate"
                  >
                    {company}
                  </label>
                </div>
              ))}
              {allCompanies.length === 0 && (
                <p className="text-sm text-gray-500">No companies found</p>
              )}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="space-y-3 md:col-span-2">
            <Label>Additional Criteria</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPhone"
                  checked={localFilters.hasPhone === true}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      hasPhone: checked ? true : null 
                    }))
                  }
                />
                <label htmlFor="hasPhone" className="text-sm">Has phone number</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasNotes"
                  checked={localFilters.hasNotes === true}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      hasNotes: checked ? true : null 
                    }))
                  }
                />
                <label htmlFor="hasNotes" className="text-sm">Has notes</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}