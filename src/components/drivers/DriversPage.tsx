
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar } from 'lucide-react';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import EmployeeList from '@/components/employees/EmployeeList';
import LeaveRequestManagement from './LeaveRequestManagement';
import { useIsMobile } from '@/hooks/use-mobile';

const DriversPage = () => {
  const [activeTab, setActiveTab] = useState('drivers');
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'p-3' : 'p-6'} space-y-4 sm:space-y-6`}>
      <ResponsiveHeader
        title="Driver Management"
        subtitle="Manage drivers and their leave requests"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-12' : ''}`}>
          <TabsTrigger value="drivers" className={`flex items-center space-x-2 ${isMobile ? 'text-sm px-2' : ''}`}>
            <Users className="h-4 w-4" />
            <span>Drivers</span>
          </TabsTrigger>
          <TabsTrigger value="leave-requests" className={`flex items-center space-x-2 ${isMobile ? 'text-sm px-2' : ''}`}>
            <Calendar className="h-4 w-4" />
            <span className={isMobile ? 'hidden' : ''}>Leave Requests</span>
            <span className={isMobile ? '' : 'hidden'}>Leave</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-6">
          <EmployeeList />
        </TabsContent>

        <TabsContent value="leave-requests" className="mt-6">
          <LeaveRequestManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriversPage;
