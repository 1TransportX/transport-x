
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminDashboard from './dashboards/AdminDashboard';
import DriverDashboard from './dashboards/DriverDashboard';

const Dashboard = () => {
  const { profile, isLoading } = useAuth();
  const isMobile = useIsMobile();

  console.log('=== Dashboard rendering - profile:', profile, 'isLoading:', isLoading);

  if (isLoading) {
    console.log('Dashboard - showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`animate-spin rounded-full ${isMobile ? 'h-8 w-8' : 'h-12 w-12'} border-b-2 border-blue-600`}></div>
      </div>
    );
  }

  if (!profile) {
    console.log('Dashboard - no profile found');
    return (
      <div className={isMobile ? 'p-4' : 'p-6'}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Dashboard</h1>
        <p className={`text-gray-600 mt-2 ${isMobile ? 'text-sm' : 'text-base'}`}>Loading profile...</p>
      </div>
    );
  }

  console.log('=== Dashboard - rendering for role:', profile.role);

  return (
    <div className="w-full">
      {(() => {
        switch (profile.role) {
          case 'admin':
            return <AdminDashboard />;
          case 'driver':
            return <DriverDashboard />;
          default:
            console.log('Dashboard - unknown role:', profile.role);
            return (
              <div className={isMobile ? 'p-4' : 'p-6'}>
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Dashboard</h1>
                <p className={`text-gray-600 mt-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Role not recognized: {profile.role}
                </p>
              </div>
            );
        }
      })()}
    </div>
  );
};

export default Dashboard;
