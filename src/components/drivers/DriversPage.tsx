
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar } from 'lucide-react';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import EmployeeList from '@/components/employees/EmployeeList';
import LeaveRequestManagement from './LeaveRequestManagement';
import { useIsMobile } from '@/hooks/use-mobile';

const DriversPage = () => {
  const [activeTab, setActiveTab] = useState('drivers');
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${isMobile ? 'p-3' : 'p-6'} space-y-4 sm:space-y-6`}>
        <ResponsiveHeader
          title="Driver Management"
          subtitle="Manage drivers and their leave requests"
        />

        <div className="bg-white rounded-lg shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-12' : 'h-10'} bg-transparent border-0 rounded-none`}>
                <TabsTrigger 
                  value="drivers" 
                  className={`flex items-center justify-center space-x-2 ${isMobile ? 'text-sm px-2' : ''} data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none`}
                >
                  <Users className="h-4 w-4" />
                  <span>Drivers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="leave-requests" 
                  className={`flex items-center justify-center space-x-2 ${isMobile ? 'text-sm px-2' : ''} data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none`}
                >
                  <Calendar className="h-4 w-4" />
                  <span className={isMobile ? 'hidden' : ''}>Leave Requests</span>
                  <span className={isMobile ? '' : 'hidden'}>Leave</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <TabsContent value="drivers" className="mt-0">
                <EmployeeList />
              </TabsContent>

              <TabsContent value="leave-requests" className="mt-0">
                <LeaveRequestManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DriversPage;
