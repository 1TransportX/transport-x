
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import EmployeeDashboard from '@/components/dashboards/EmployeeDashboard';
import DriverDashboard from '@/components/dashboards/DriverDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'driver':
      return <DriverDashboard />;
    default:
      return <div>Unknown user role</div>;
  }
};

export default Dashboard;
