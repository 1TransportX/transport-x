
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './dashboards/AdminDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import DriverDashboard from './dashboards/DriverDashboard';

const Dashboard = () => {
  const { profile, isLoading } = useAuth();

  console.log('=== Dashboard rendering - profile:', profile, 'isLoading:', isLoading);

  if (isLoading) {
    console.log('Dashboard - showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    console.log('Dashboard - no profile found');
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Loading profile...</p>
      </div>
    );
  }

  console.log('=== Dashboard - rendering for role:', profile.role);

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'driver':
      return <DriverDashboard />;
    default:
      console.log('Dashboard - unknown role:', profile.role);
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-2">Role not recognized: {profile.role}</p>
        </div>
      );
  }
};

export default Dashboard;
