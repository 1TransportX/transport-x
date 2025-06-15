
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = () => {
  const isMobile = useIsMobile();
  
  console.log('Layout component rendering');
  
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Navigation />
      <main className={`${isMobile ? 'p-3 sm:p-4' : 'p-6'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
