import React from 'react';
import { useLocation } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomBar from './MobileBottomBar';
import Header from '../ui/Header';
import { usePlocState } from '@hooks/use-ploc-state';
import { useAuthPloc } from '@contexts/auth-context';

export const NavShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);
  const location = useLocation();
  const isAuthenticated = authState.kind === 'auth:authenticated';
  const isChatRoute = location.pathname.startsWith('/chat');

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
        <div className={`flex-1 overflow-y-auto ${isChatRoute ? 'flex flex-col' : ''}`}>
          <main className={isChatRoute ? 'flex-1 flex flex-col min-h-0' : 'p-4 lg:p-8 max-w-7xl w-full mx-auto'}>
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
