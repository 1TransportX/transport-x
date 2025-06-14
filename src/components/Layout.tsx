
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const Layout = () => {
  console.log('Layout component rendering');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
