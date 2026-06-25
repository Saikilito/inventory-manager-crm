import React from 'react';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';
import { useShell } from '@contexts/ShellContext';
import { Sun, Moon, User } from 'lucide-react';
import { ElectronicBrainLogo } from '@components/shell/ElectronicBrainLogo';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useShell();
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);

  const user = authState.kind === 'auth:authenticated' ? authState.user : null;
  const isAuthenticated = user !== null;

  return (
    <header className="h-16 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
      {/* Page Title or Brand on Mobile */}
      <div className="flex items-center gap-2">
        <div className="lg:hidden flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
            <ElectronicBrainLogo className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-amber-500 dark:text-amber-400">
            Invertor-AI
          </span>
        </div>
        <span className="hidden lg:inline text-sm font-semibold text-stone-500 dark:text-stone-400">
          Management Console
        </span>
      </div>

      {/* User Session Info & Theme Quick Toggle */}
      <div className="flex items-center gap-4">
        {/* Quick Theme Toggle for Topbar */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {isAuthenticated && user && (
          <div className="flex items-center gap-2.5 pl-4 border-l border-stone-200 dark:border-stone-800">
            {/* User Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <User className="w-4 h-4" />
            </div>

            {/* Profile Info */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
