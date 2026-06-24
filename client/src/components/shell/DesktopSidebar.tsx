import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';
import { useShell } from '@contexts/ShellContext';
import { UserRole } from '@shared-domain/shared/value-objects/role.vo';
import {
  LayoutDashboard,
  Users,
  Package,
  UserPlus,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar, theme, toggleTheme } = useShell();
  const location = useLocation();
  const navigate = useNavigate();
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);

  const isAuthenticated = authState.kind === 'auth:authenticated';
  const user = isAuthenticated ? (authState as any).user : null;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await authPloc.logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      path: '/clients',
      label: 'Clients',
      icon: Users,
    },
    {
      path: '/products',
      label: 'Products',
      icon: Package,
    },
    {
      path: '/chat',
      label: 'Chat',
      icon: MessageSquare,
    },
  ];

  if (user?.role === UserRole.ADMIN) {
    navItems.push({
      path: '/register',
      label: 'Create User',
      icon: UserPlus,
    });
  }

  return (
    <aside
      className={`hidden lg:flex flex-col bg-stone-900 dark:bg-stone-950 text-stone-100 border-r border-stone-800 transition-all duration-300 ease-out-expo h-screen sticky top-0 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
      aria-label="Desktop Sidebar Navigation"
    >
      {/* Brand header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-stone-800">
        {!isSidebarCollapsed && (
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-stone-100 to-stone-400 bg-clip-text text-transparent">
            CRM Suite
          </span>
        )}
        {isSidebarCollapsed && (
          <span className="mx-auto font-black text-lg bg-gradient-to-r from-stone-100 to-stone-400 bg-clip-text text-transparent">
            CS
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
              {isSidebarCollapsed && (
                <span className="absolute left-14 bg-stone-950 text-stone-100 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls (Theme toggle & Logout) */}
      <div className="p-3 border-t border-stone-800 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors group relative focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Sun className="w-5 h-5 flex-shrink-0" />
          )}
          {!isSidebarCollapsed && (
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          )}
          {isSidebarCollapsed && (
            <span className="absolute left-14 bg-stone-950 text-stone-100 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
        </button>

        {/* Logout Button */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-100 hover:bg-red-950/40 transition-colors group relative focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            aria-label="Log out of application"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
            {isSidebarCollapsed && (
              <span className="absolute left-14 bg-stone-950 text-stone-100 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                Sign Out
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
