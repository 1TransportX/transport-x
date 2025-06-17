
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar } from 'lucide-react';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import EmployeeList from '@/components/employees/EmployeeList';
import LeaveRequestManagement from './LeaveRequestManagement';

const DriversPage = () => {
  const [activeTab, setActiveTab] = useState('drivers');

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <ResponsiveHeader
        title="Driver Management"
        subtitle="Manage drivers and their leave requests"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drivers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Drivers</span>
          </TabsTrigger>
          <TabsTrigger value="leave-requests" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Leave Requests</span>
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
