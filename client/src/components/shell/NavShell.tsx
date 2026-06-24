import React from 'react';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomBar from './MobileBottomBar';
import Header from '../ui/Header';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';

export const NavShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);
  const isAuthenticated = authState.kind === 'auth:authenticated';

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 transition-colors duration-300">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 transition-colors duration-300">
      {/* Sidebar on desktop */}
      <DesktopSidebar />

      {/* Main viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden pb-16 lg:pb-0">
        {/* Topbar / Header */}
        <Header />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom navigation on mobile */}
      <MobileBottomBar />
    </div>
  );
};

export default NavShell;
