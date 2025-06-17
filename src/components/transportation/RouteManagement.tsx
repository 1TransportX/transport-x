
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, MapPin } from 'lucide-react';
import RouteOptimizer from './RouteOptimizer';
import DailyRouteAssignment from './DailyRouteAssignment';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

const RouteManagement = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('daily-assignment');

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-12' : 'h-10'}`}>
          <TabsTrigger 
            value="daily-assignment" 
            className={`flex items-center gap-2 ${isMobile ? 'text-sm px-3' : 'text-sm'}`}
          >
            <MapPin className="h-4 w-4" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Daily Routes</span>
          </TabsTrigger>
          <TabsTrigger 
            value="route-optimizer" 
            className={`flex items-center gap-2 ${isMobile ? 'text-sm px-3' : 'text-sm'}`}
          >
            <Route className="h-4 w-4" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Optimizer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-assignment" className="space-y-4">
          <DailyRouteAssignment />
        </TabsContent>

        <TabsContent value="route-optimizer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Route Optimizer
              </CardTitle>
              <CardDescription>
                Optimize delivery routes for minimum travel distance and time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RouteOptimizer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteManagement;
