
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Route, MapPin, Plus, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FleetManagement from '@/components/fleet/FleetManagement';
import RouteManagement from './RouteManagement';
import AssignRouteToDriverDialog from '@/components/dashboards/AssignRouteToDriverDialog';

const TransportationPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showAssignRouteDialog, setShowAssignRouteDialog] = useState(false);

  console.log('TransportationPage: Component rendering for role:', profile?.role);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        {profile.role === 'admin' && (
          <Button 
            onClick={() => setShowAssignRouteDialog(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Assign Routes to Driver
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet</p>
                <p className="text-2xl font-bold">Management</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Route className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Route</p>
                <p className="text-2xl font-bold">Planning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Driver</p>
                <p className="text-2xl font-bold">Assignment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fleet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
          <TabsTrigger value="routes">Route Management</TabsTrigger>
          {profile.role === 'admin' && (
            <TabsTrigger value="assignments">Driver Assignments</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="fleet" className="space-y-4">
          <FleetManagement />
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <RouteManagement />
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
                    Use the "Assign Routes to Driver" button above to assign delivery routes to your drivers.
                  </p>
                  <Button 
                    onClick={() => setShowAssignRouteDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Assign New Routes
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
          // Refresh any relevant data if needed
        }}
      />
    </div>
  );
};

export default TransportationPage;
