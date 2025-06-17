
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Truck, Users, Route, Zap } from 'lucide-react';
import { useDailyRouteAssignments } from '@/hooks/useDailyRouteAssignments';
import { useAuth } from '@/hooks/useAuth';
import CreateDailyAssignmentDialog from './CreateDailyAssignmentDialog';
import DeliveryAssignmentCard from './DeliveryAssignmentCard';

const DailyRouteAssignment = () => {
  const { profile } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    selectedDate,
    setSelectedDate,
    assignments,
    drivers,
    availableDeliveries,
    isLoading,
    isOptimizing,
    optimizeAllRoutes,
    deleteAssignment
  } = useDailyRouteAssignments();

  console.log('DailyRouteAssignment: Rendering with date:', selectedDate);
  console.log('DailyRouteAssignment: Assignments:', assignments?.length);
  console.log('DailyRouteAssignment: Available deliveries:', availableDeliveries?.length);

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';
  };

  const getTotalStats = () => {
    const totalDistance = assignments.reduce((sum, assignment) => sum + (assignment.total_distance || 0), 0);
    const totalDuration = assignments.reduce((sum, assignment) => sum + (assignment.estimated_duration || 0), 0);
    const totalDeliveries = assignments.reduce((sum, assignment) => sum + assignment.delivery_ids.length, 0);
    
    return { totalDistance, totalDuration, totalDeliveries };
  };

  const stats = getTotalStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Route Assignment</h2>
          <p className="text-gray-600 mt-1">Assign and optimize routes for drivers by date</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={optimizeAllRoutes}
            disabled={isOptimizing || assignments.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Zap className={`h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Optimizing...' : 'Optimize All Routes'}
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Route className="h-4 w-4" />
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <Label htmlFor="assignment-date">Assignment Date</Label>
              <Input
                id="assignment-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              {availableDeliveries.length} unassigned deliveries available
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Drivers Assigned</p>
                  <p className="text-xl font-bold">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Deliveries</p>
                  <p className="text-xl font-bold">{stats.totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-xl font-bold">{stats.totalDistance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-xl font-bold">{Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Route Assignments */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Assignments</h3>
              <p className="text-gray-600 mb-4">
                No route assignments found for {new Date(selectedDate).toLocaleDateString()}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create First Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <DeliveryAssignmentCard
              key={assignment.id}
              assignment={assignment}
              driverName={getDriverName(assignment.driver_id)}
              onDelete={() => deleteAssignment(assignment.id)}
            />
          ))
        )}
      </div>

      <CreateDailyAssignmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        selectedDate={selectedDate}
        availableDeliveries={availableDeliveries}
        drivers={drivers}
      />
    </div>
  );
};

export default DailyRouteAssignment;
