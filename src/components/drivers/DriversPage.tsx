
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar } from 'lucide-react';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import EmployeeList from '@/components/employees/EmployeeList';
import LeaveRequestManagement from './LeaveRequestManagement';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const DriversPage = () => {
  console.log('DriversPage - Component rendering started');
  console.log('DriversPage - Environment check:', {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    viewport: typeof window !== 'undefined' ? {
      width: window.innerWidth,
      height: window.innerHeight
    } : 'Server'
  });
  
  const [activeTab, setActiveTab] = useState('drivers');
  console.log('DriversPage - Active tab state:', activeTab);

  try {
    return (
      <ErrorBoundary>
        <div className="w-full min-h-screen bg-gray-50">
          <div className="w-full px-3 py-3 sm:px-6 sm:py-6">
            <div className="w-full space-y-4 sm:space-y-6">
              <ResponsiveHeader
                title="Driver Management"
                subtitle="Manage drivers and their leave requests"
              />

              <div className="w-full bg-white rounded-lg shadow-sm">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="w-full border-b border-gray-200">
                    <TabsList className="w-full h-auto bg-transparent border-0 rounded-none p-0 flex">
                      <TabsTrigger 
                        value="drivers" 
                        className="flex-1 h-12 sm:h-10 flex items-center justify-center gap-2 px-2 sm:px-4 text-sm font-medium transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-0"
                      >
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Drivers</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="leave-requests" 
                        className="flex-1 h-12 sm:h-10 flex items-center justify-center gap-2 px-2 sm:px-4 text-sm font-medium transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-0"
                      >
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate block sm:hidden">Leave</span>
                        <span className="truncate hidden sm:block">Leave Requests</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="w-full">
                    <TabsContent value="drivers" className="w-full m-0 p-0">
                      <ErrorBoundary fallback={
                        <div className="p-6 text-center">
                          <p className="text-red-600">Error loading employee list</p>
                        </div>
                      }>
                        <EmployeeList />
                      </ErrorBoundary>
                    </TabsContent>

                    <TabsContent value="leave-requests" className="w-full m-0 p-0">
                      <div className="w-full p-3 sm:p-6">
                        <ErrorBoundary fallback={
                          <div className="p-6 text-center">
                            <p className="text-red-600">Error loading leave requests</p>
                          </div>
                        }>
                          <LeaveRequestManagement />
                        </ErrorBoundary>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('DriversPage - Render error:', error);
    throw error;
  }
};

export default DriversPage;
