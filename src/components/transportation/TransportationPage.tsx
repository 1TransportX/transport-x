
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
          <CardHeader>
            <CardTitle className={isMobile ? 'text-lg' : 'text-2xl'}>Driver Route Assignments</CardTitle>
            <CardDescription className={isMobile ? 'text-sm' : 'text-base'}>
              Assign delivery routes to drivers and manage route schedules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4">
              <Calendar className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-gray-400`} />
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 text-center`}>
                Route Assignment Center
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600 text-center max-w-md px-4`}>
                Assign delivery routes to your drivers and manage route schedules.
              </p>
              <Button 
                onClick={() => setShowAssignRouteDialog(true)}
                className="flex items-center gap-2"
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
      <div className="space-y-4">
        <div className="space-y-2">
          <ResponsiveText as="h1" size="3xl" className="font-bold">
            Transportation Management
          </ResponsiveText>
          <ResponsiveText size="sm" className="text-gray-600">
            Manage fleet, routes, and driver assignments.
          </ResponsiveText>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {tabs.map((tab) => (
            <AccordionItem key={tab.value} value={tab.value} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="font-medium">{tab.label}</span>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transportation Management</h1>
          <p className="text-gray-600 mt-2">Manage fleet, routes, and driver assignments.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes">Route Management</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
          {profile.role === 'admin' && (
            <TabsTrigger value="assignments">Driver Assignments</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <RouteManagement />
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <FleetManagement />
        </TabsContent>

        {profile.role === 'admin' && (
          <TabsContent value="assignments" className="space-y-4">
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
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Assign Routes to Driver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

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
