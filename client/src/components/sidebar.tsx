import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutGrid, 
  GitBranch, 
  Users, 
  FileText, 
  BarChart3,
  User,
  LogOut,
  Database,
  Sparkles
} from "lucide-react";
import requisorLogo from "@assets/Requisor Logo_1753816063994.png";

interface SidebarProps {
  currentView: 'grid' | 'pipeline';
  onViewChange: (view: 'grid' | 'pipeline') => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user } = useAuth();

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo & Brand */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src={requisorLogo} 
            alt="Requisor" 
            className="w-8 h-8 object-contain"
          />
          <h1 className="ml-3 text-xl font-bold requisor-turquoise">Requisor CRM</h1>
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
                  ? "requisor-turquoise bg-requisor-light hover:bg-requisor-light" 
                  : "text-gray-700 hover:text-requisor-turquoise hover:bg-gray-50"
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
                  ? "requisor-turquoise bg-requisor-light hover:bg-requisor-light" 
                  : "text-gray-700 hover:text-requisor-turquoise hover:bg-gray-50"
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
              onClick={() => window.location.href = '/custom-tables'}
            >
              <Database className="mr-3 h-5 w-5" />
              Custom Tables
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-700 hover:text-requisor-turquoise hover:bg-gray-50"
              onClick={() => window.location.href = '/outreach'}
            >
              <Sparkles className="mr-3 h-5 w-5" />
              Sales Outreach
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
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'
                }
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
            onClick={() => window.location.href = '/api/logout'}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
