
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FleetManagement from '@/components/fleet/FleetManagement';
import RouteManagement from './RouteManagement';
import AssignRouteToDriverDialog from '@/components/dashboards/AssignRouteToDriverDialog';
import { ResponsiveText } from '@/components/ui/responsive-text';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import { ResponsiveTabs, ResponsiveTabsList, ResponsiveTabsTrigger, ResponsiveTabsContent } from '@/components/ui/responsive-tabs';

const TransportationPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAssignRouteDialog, setShowAssignRouteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('routes');

  console.log('TransportationPage: Component rendering for role:', profile?.role);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { value: 'routes', label: 'Route Management', content: <RouteManagement /> },
    { value: 'fleet', label: 'Fleet Management', content: <FleetManagement /> },
    ...(profile.role === 'admin' ? [{
      value: 'assignments',
      label: 'Driver Assignments',
      content: (
        <Card>
          <CardHeader className={isMobile ? 'p-4' : 'p-6'}>
            <CardTitle className={isMobile ? 'text-lg' : 'text-2xl'}>Driver Route Assignments</CardTitle>
            <CardDescription className={isMobile ? 'text-sm' : 'text-base'}>
              Assign delivery routes to drivers and manage route schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className={isMobile ? 'p-4' : 'p-6'}>
            <div className={`flex flex-col items-center justify-center ${isMobile ? 'py-6 space-y-3' : 'py-8 sm:py-12 space-y-4'}`}>
              <Calendar className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12 sm:h-16 sm:w-16'} text-gray-400`} />
              <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-medium text-gray-900 text-center`}>
                Route Assignment Center
              </h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} text-gray-600 text-center max-w-md px-4`}>
                Assign delivery routes to your drivers and manage route schedules.
              </p>
              <Button 
                onClick={() => setShowAssignRouteDialog(true)}
                className="flex items-center gap-2 relative z-50"
                size={isMobile ? 'sm' : 'default'}
              >
                <Users className="h-4 w-4" />
                Assign Routes to Driver
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }] : [])
  ];

  if (isMobile) {
    return (
      <div className="space-y-4 p-3">
        <ResponsiveHeader
          title="Transportation Management"
          subtitle="Manage fleet, routes, and driver assignments."
        />

        <Accordion type="single" collapsible className="space-y-2">
          {tabs.map((tab) => (
            <AccordionItem key={tab.value} value={tab.value} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="font-medium text-sm">{tab.label}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {tab.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <AssignRouteToDriverDialog 
          isOpen={showAssignRouteDialog}
          onClose={() => setShowAssignRouteDialog(false)}
          onSuccess={() => {
            setShowAssignRouteDialog(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ResponsiveHeader
        title="Transportation Management"
        subtitle="Manage fleet, routes, and driver assignments."
      />

      <ResponsiveTabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ResponsiveTabsList>
          <ResponsiveTabsTrigger value="routes">Route Management</ResponsiveTabsTrigger>
          <ResponsiveTabsTrigger value="fleet">Fleet Management</ResponsiveTabsTrigger>
          {profile.role === 'admin' && (
            <ResponsiveTabsTrigger value="assignments">Driver Assignments</ResponsiveTabsTrigger>
          )}
        </ResponsiveTabsList>

        <ResponsiveTabsContent value="routes" className="space-y-4">
          <RouteManagement />
        </ResponsiveTabsContent>

        <ResponsiveTabsContent value="fleet" className="space-y-4">
          <FleetManagement />
        </ResponsiveTabsContent>

        {profile.role === 'admin' && (
          <ResponsiveTabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver Route Assignments</CardTitle>
                <CardDescription>
                  Assign delivery routes to drivers and manage route schedules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Calendar className="h-16 w-16 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Route Assignment Center</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Assign delivery routes to your drivers and manage route schedules.
                  </p>
                  <Button 
                    onClick={() => setShowAssignRouteDialog(true)}
                    className="flex items-center gap-2 relative z-50"
                  >
                    <Users className="h-4 w-4" />
                    Assign Routes to Driver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ResponsiveTabsContent>
        )}
      </ResponsiveTabs>

      <AssignRouteToDriverDialog 
        isOpen={showAssignRouteDialog}
        onClose={() => setShowAssignRouteDialog(false)}
        onSuccess={() => {
          setShowAssignRouteDialog(false);
        }}
      />
    </div>
  );
};

export default TransportationPage;
