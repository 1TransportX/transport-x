
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Truck, Users, Package, Route, Plus } from 'lucide-react';
import { useDailyRouteAssignments } from '@/hooks/useDailyRouteAssignments';
import { useAuth } from '@/hooks/useAuth';
import CreateRouteDialog from './CreateDailyAssignmentDialog';
import DateGroupSection from './DateGroupSection';
import RouteFilterBar from './RouteFilterBar';

const DailyRouteAssignment = React.memo(() => {
  const { profile } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const {
    dateRange,
    setDateRange,
    quickFilter,
    setQuickFilter,
    searchQuery,
    setSearchQuery,
    dateGroups,
    drivers,
    getAvailableDeliveriesForDate,
    isLoading,
    isOptimizing,
    optimizeRoutesForDate,
    deleteAssignment
  } = useDailyRouteAssignments();

  console.log('DailyRouteAssignment: Rendering with date groups:', dateGroups?.length);

  // Memoize the create route handler to prevent recreation on every render
  const handleCreateRoute = useCallback((date: string) => {
    setSelectedDate(date);
    setShowCreateDialog(true);
  }, []);

  // Memoize available deliveries for the selected date
  const availableDeliveries = useMemo(() => {
    return selectedDate ? getAvailableDeliveriesForDate(selectedDate) : [];
  }, [selectedDate, getAvailableDeliveriesForDate]);

  // Memoize total stats calculation to prevent expensive recalculations
  const totalStats = useMemo(() => {
    const totalDrivers = dateGroups.reduce((sum, group) => sum + group.totalDrivers, 0);
    const totalDeliveries = dateGroups.reduce((sum, group) => sum + group.totalDeliveries, 0);
    const totalDistance = dateGroups.reduce((sum, group) => sum + group.totalDistance, 0);
    const totalDuration = dateGroups.reduce((sum, group) => sum + group.totalDuration, 0);
    const totalUnassigned = dateGroups.reduce((sum, group) => sum + group.unassignedDeliveries, 0);
    const totalAssignments = dateGroups.reduce((sum, group) => sum + group.assignments.length, 0);
    
    return { totalDrivers, totalDeliveries, totalDistance, totalDuration, totalUnassigned, totalAssignments };
  }, [dateGroups]);

  // Memoize dialog close handler
  const handleDialogClose = useCallback((open: boolean) => {
    setShowCreateDialog(open);
  }, []);

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Route className="h-6 w-6" />
            Route Schedule Overview
          </h2>
          <p className="text-gray-600 mt-1">View and manage all route assignments by date</p>
        </div>
        <Button
          onClick={() => handleCreateRoute(new Date().toISOString().split('T')[0])}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Route
        </Button>
      </div>

      {/* Filter Bar */}
      <RouteFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalGroups={dateGroups.length}
        totalAssignments={totalStats.totalAssignments}
      />

      {/* Summary Stats */}
      {totalStats.totalAssignments > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Dates</p>
                  <p className="text-xl font-bold">{dateGroups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Drivers</p>
                  <p className="text-xl font-bold">{totalStats.totalDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Deliveries</p>
                  <p className="text-xl font-bold">{totalStats.totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="text-xl font-bold">{totalStats.totalDistance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-xl font-bold">{Math.round(totalStats.totalDuration / 60)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unassigned Deliveries Alert */}
      {totalStats.totalUnassigned > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Package className="h-5 w-5" />
              <span className="font-medium">
                {totalStats.totalUnassigned} unassigned deliveries available for assignment
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Groups */}
      <div className="space-y-4">
        {dateGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Assignments Found</h3>
              <p className="text-gray-600 mb-4">
                No route assignments found for the selected date range.
              </p>
              <Button onClick={() => handleCreateRoute(new Date().toISOString().split('T')[0])}>
                Create First Route
              </Button>
            </CardContent>
          </Card>
        ) : (
          dateGroups.map((dateGroup) => (
            <DateGroupSection
              key={dateGroup.date}
              dateGroup={dateGroup}
              drivers={drivers}
              onCreateAssignment={handleCreateRoute}
              onOptimizeDate={optimizeRoutesForDate}
              onDeleteAssignment={deleteAssignment}
              isOptimizing={isOptimizing}
            />
          ))
        )}
      </div>

      <CreateRouteDialog
        open={showCreateDialog}
        onOpenChange={handleDialogClose}
        selectedDate={selectedDate}
        availableDeliveries={availableDeliveries}
        drivers={drivers}
      />
    </div>
  );
});

DailyRouteAssignment.displayName = 'DailyRouteAssignment';

export default DailyRouteAssignment;
