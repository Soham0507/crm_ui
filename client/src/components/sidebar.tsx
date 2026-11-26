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
import requisorLogo from "@assets/requisor-mascot.png";

// Shared look of the navigation entries.
const navItem = "w-full justify-start";
const navActive =
  "bg-brand text-white shadow-press-brand-down hover:bg-brand hover:text-white";
const navIdle = "text-ink-body hover:bg-brand-soft hover:text-brand";

// Only the dashboard passes these. Other pages leave them out.
interface SidebarProps {
  currentView?: 'grid' | 'pipeline';
  onViewChange?: (view: 'grid' | 'pipeline') => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user } = useAuth();

  const path = window.location.pathname;

  // Switch views in place on the dashboard; from other pages, go to the dashboard.
  const showView = (view: 'grid' | 'pipeline') => {
    if (onViewChange) {
      onViewChange(view);
    } else {
      window.location.href = view === 'pipeline' ? '/?view=pipeline' : '/';
    }
  };

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
    <div className="sticky top-4 m-4 mr-0 flex h-[calc(100vh-2rem)] w-60 shrink-0 flex-col self-start overflow-y-auto rounded-[24px] bg-white shadow-depth-sm">
      {/* Logo & Brand */}
      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-center">
          <img 
            src={requisorLogo} 
            alt="Requisor" 
            className="h-10 w-10 rounded-full shadow-[0_6px_14px_-4px_rgba(15,118,110,0.45)]"
          />
          <h1 className="ml-2.5 text-[17px] font-extrabold tracking-tight text-ink">Requisor CRM</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        <div className="mb-6">
          <h2 className="px-3 text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Views
          </h2>
          <div className="mt-2 space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(navItem, currentView === 'grid' ? navActive : navIdle)}
              onClick={() => showView('grid')}
            >
              <LayoutGrid className="mr-3 h-5 w-5" />
              Grid View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(navItem, currentView === 'pipeline' ? navActive : navIdle)}
              onClick={() => showView('pipeline')}
            >
              <GitBranch className="mr-3 h-5 w-5" />
              Pipeline
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="px-3 text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Management
          </h2>
          <div className="mt-2 space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(navItem, navIdle)}
            >
              <Users className="mr-3 h-5 w-5" />
              Contacts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(navItem, path === '/custom-tables' ? navActive : navIdle)}
              onClick={() => window.location.href = '/custom-tables'}
            >
              <Database className="mr-3 h-5 w-5" />
              Custom Tables
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(navItem, path === '/outreach' ? navActive : navIdle)}
              onClick={() => window.location.href = '/outreach'}
            >
              <Sparkles className="mr-3 h-5 w-5" />
              Sales Outreach
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(navItem, navIdle)}
            >
              <FileText className="mr-3 h-5 w-5" />
              Tasks
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(navItem, navIdle)}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Reports
            </Button>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-brand-soft text-brand text-xs font-bold">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-bold text-ink truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'
                }
              </p>
              <p className="text-xs text-ink-muted truncate">{user?.email}</p>
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
