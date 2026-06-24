import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';
import { useShell } from '@contexts/ShellContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const { theme, toggleTheme } = useShell();
  const location = useLocation();
  const navigate = useNavigate();
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);

  const isAuthenticated = authState.kind === 'auth:authenticated';

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await authPloc.logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Panel',
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
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-stone-900 dark:bg-stone-950 border-t border-stone-800 flex items-center justify-around px-2 z-50 pb-safe"
      aria-label="Mobile Bottom Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center focus-visible:bg-stone-800 focus-visible:outline-none transition-colors ${
              active ? 'text-emerald-400' : 'text-stone-400 hover:text-stone-100'
            }`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center text-stone-400 hover:text-stone-100 focus-visible:bg-stone-800 focus-visible:outline-none transition-colors"
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 mb-0.5" />
        ) : (
          <Sun className="w-5 h-5 mb-0.5" />
        )}
        <span className="text-[10px] font-medium leading-none">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      </button>

      {/* Logout */}
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center text-stone-400 hover:text-red-400 focus-visible:bg-stone-800 focus-visible:outline-none transition-colors"
          aria-label="Sign out of application"
        >
          <LogOut className="w-5 h-5 mb-0.5 text-stone-400" />
          <span className="text-[10px] font-medium leading-none">Exit</span>
        </button>
      )}
    </nav>
  );
};

export default MobileBottomBar;
