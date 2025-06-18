import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  GitBranch, 
  Users, 
  FileText, 
  BarChart3,
  User
} from "lucide-react";

interface SidebarProps {
  currentView: 'grid' | 'pipeline';
  onViewChange: (view: 'grid' | 'pipeline') => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo & Brand */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="ml-3 text-xl font-bold text-gray-900">CRM Pro</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        <div className="mb-6">
          <h2 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Views
          </h2>
          <div className="mt-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start",
                currentView === 'grid' 
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-50" 
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              )}
              onClick={() => onViewChange('grid')}
            >
              <LayoutGrid className="mr-3 h-5 w-5" />
              Grid View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start",
                currentView === 'pipeline' 
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-50" 
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              )}
              onClick={() => onViewChange('pipeline')}
            >
              <GitBranch className="mr-3 h-5 w-5" />
              Pipeline
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Management
          </h2>
          <div className="mt-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              <Users className="mr-3 h-5 w-5" />
              Contacts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              <FileText className="mr-3 h-5 w-5" />
              Tasks
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Reports
            </Button>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">John Doe</p>
            <p className="text-xs text-gray-500">john@company.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
