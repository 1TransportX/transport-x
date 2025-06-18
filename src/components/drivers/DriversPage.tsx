
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
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-full px-3 py-3 sm:px-6 sm:py-6">
        <div className="w-full space-y-4 sm:space-y-6">
          <ResponsiveHeader
            title="Driver Management"
            subtitle="Manage drivers and their leave requests"
          />

          <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="w-full border-b border-gray-200">
                <TabsList className="w-full h-auto bg-transparent border-0 rounded-none p-0 grid grid-cols-2">
                  <TabsTrigger 
                    value="drivers" 
                    className="w-full h-12 sm:h-10 flex items-center justify-center gap-2 px-2 sm:px-4 text-sm font-medium transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-0"
                  >
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Drivers</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="leave-requests" 
                    className="w-full h-12 sm:h-10 flex items-center justify-center gap-2 px-2 sm:px-4 text-sm font-medium transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-0"
                  >
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate hidden xs:inline">Leave Requests</span>
                    <span className="truncate xs:hidden">Leave</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="w-full">
                <TabsContent value="drivers" className="w-full m-0 p-0">
                  <div className="w-full">
                    <EmployeeList />
                  </div>
                </TabsContent>

                <TabsContent value="leave-requests" className="w-full m-0 p-0">
                  <div className="w-full p-3 sm:p-6">
                    <LeaveRequestManagement />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriversPage;
