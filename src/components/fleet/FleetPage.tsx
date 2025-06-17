
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import FleetManagement from '@/components/fleet/FleetManagement';

const FleetPage = () => {
  const { profile } = useAuth();

  console.log('FleetPage: Component rendering for role:', profile?.role);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <ResponsiveHeader
        title="Fleet Management"
        subtitle="Manage vehicles, assignments, and tracking."
      />
      
      <FleetManagement />
    </div>
  );
};

export default FleetPage;
