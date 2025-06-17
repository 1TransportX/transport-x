
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';

interface DailyRouteAssignment {
  id: string;
  assignment_date: string;
  driver_id: string;
  delivery_ids: string[];
  optimized_order: number[];
  total_distance: number;
  estimated_duration: number;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface DeliveryForAssignment {
  id: string;
  customer_name: string;
  customer_address: string;
  delivery_number: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface DriverForAssignment {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DateGroup {
  date: string;
  assignments: DailyRouteAssignment[];
  totalDrivers: number;
  totalDeliveries: number;
  totalDistance: number;
  totalDuration: number;
  unassignedDeliveries: number;
}

type QuickFilter = 'all' | 'today' | 'week' | 'next7days';

export const useDailyRouteAssignments = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: addDays(new Date(), 30)
  });
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('next7days');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate effective date range based on quick filter
  const effectiveDateRange = useMemo(() => {
    const today = new Date();
    switch (quickFilter) {
      case 'today':
        return { from: today, to: today };
      case 'week':
        return { from: today, to: addDays(today, 7) };
      case 'next7days':
        return { from: today, to: addDays(today, 7) };
      case 'all':
      default:
        return dateRange;
    }
  }, [quickFilter, dateRange]);

  // Fetch assignments for date range
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['daily-route-assignments-range', effectiveDateRange.from, effectiveDateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_route_assignments')
        .select('*')
        .gte('assignment_date', format(effectiveDateRange.from, 'yyyy-MM-dd'))
        .lte('assignment_date', format(effectiveDateRange.to, 'yyyy-MM-dd'))
        .order('assignment_date', { ascending: true });

      if (error) throw error;
      return data as DailyRouteAssignment[];
    }
  });

  // Fetch available drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers-for-assignment'],
    queryFn: async () => {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['driver', 'admin']);

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        return [];
      }

      const userIds = userRoles.map(role => role.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      return profiles as DriverForAssignment[];
    }
  });

  // Fetch deliveries for the date range
  const { data: allDeliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['deliveries-for-range', effectiveDateRange.from, effectiveDateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, customer_name, customer_address, delivery_number, status, latitude, longitude, scheduled_date')
        .gte('scheduled_date', format(effectiveDateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(effectiveDateRange.to, 'yyyy-MM-dd'))
        .eq('status', 'pending');

      if (error) throw error;
      return data as (DeliveryForAssignment & { scheduled_date: string })[];
    }
  });

  // Memoize assigned delivery IDs to prevent circular dependencies
  const assignedDeliveryIds = useMemo(() => {
    const assignedIds = new Set<string>();
    assignments.forEach(assignment => {
      assignment.delivery_ids.forEach(id => assignedIds.add(id));
    });
    return assignedIds;
  }, [assignments]);

  // Stable function to get assigned delivery IDs
  const getAssignedDeliveryIds = useCallback(() => {
    return assignedDeliveryIds;
  }, [assignedDeliveryIds]);

  // Get available deliveries for a specific date - now with stable dependencies
  const getAvailableDeliveriesForDate = useCallback((date: string) => {
    return allDeliveries.filter(
      delivery => delivery.scheduled_date === date && !assignedDeliveryIds.has(delivery.id)
    );
  }, [allDeliveries, assignedDeliveryIds]);

  // Group assignments by date with statistics - optimized dependencies
  const dateGroups = useMemo((): DateGroup[] => {
    const groupMap = new Map<string, DateGroup>();

    // Initialize groups for all dates in range
    const currentDate = new Date(effectiveDateRange.from);
    const endDate = new Date(effectiveDateRange.to);
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const unassignedForDate = allDeliveries.filter(
        d => d.scheduled_date === dateStr && !assignedDeliveryIds.has(d.id)
      ).length;

      groupMap.set(dateStr, {
        date: dateStr,
        assignments: [],
        totalDrivers: 0,
        totalDeliveries: 0,
        totalDistance: 0,
        totalDuration: 0,
        unassignedDeliveries: unassignedForDate
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add assignments to their respective date groups
    assignments.forEach(assignment => {
      const group = groupMap.get(assignment.assignment_date);
      if (group) {
        group.assignments.push(assignment);
        group.totalDrivers += 1;
        group.totalDeliveries += assignment.delivery_ids.length;
        group.totalDistance += assignment.total_distance || 0;
        group.totalDuration += assignment.estimated_duration || 0;
      }
    });

    // Filter by search query if provided
    const filteredGroups = Array.from(groupMap.values());
    if (searchQuery.trim()) {
      return filteredGroups.filter(group => {
        return group.assignments.some(assignment => {
          const driverName = drivers.find(d => d.id === assignment.driver_id);
          const fullName = `${driverName?.first_name} ${driverName?.last_name}`.toLowerCase();
          return fullName.includes(searchQuery.toLowerCase());
        });
      });
    }

    return filteredGroups.filter(group => 
      group.assignments.length > 0 || group.unassignedDeliveries > 0
    );
  }, [assignments, allDeliveries, drivers, searchQuery, effectiveDateRange, assignedDeliveryIds]);

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: Omit<DailyRouteAssignment, 'id' | 'created_at' | 'updated_at'>) => {
      const duplicateIds = assignment.delivery_ids.filter(id => assignedDeliveryIds.has(id));
      
      if (duplicateIds.length > 0) {
        throw new Error(`Some deliveries are already assigned: ${duplicateIds.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('daily_route_assignments')
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-route-assignments-range'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-for-range'] });
      toast({
        title: "Assignment Created",
        description: "Daily route assignment has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment.",
        variant: "destructive",
      });
    }
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, ...assignment }: Partial<DailyRouteAssignment> & { id: string }) => {
      const { data, error } = await supabase
        .from('daily_route_assignments')
        .update(assignment)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-route-assignments-range'] });
      toast({
        title: "Assignment Updated",
        description: "Daily route assignment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assignment.",
        variant: "destructive",
      });
    }
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_route_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-route-assignments-range'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-for-range'] });
      toast({
        title: "Assignment Deleted",
        description: "Daily route assignment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete assignment.",
        variant: "destructive"
      });
    }
  });

  // Optimize routes for a specific date
  const optimizeRoutesForDate = useCallback(async (date: string) => {
    const dateAssignments = assignments.filter(a => a.assignment_date === date);
    
    if (dateAssignments.length === 0) {
      toast({
        title: "No assignments",
        description: `No assignments found for ${new Date(date).toLocaleDateString()}.`,
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const startLocation = {
        latitude: 28.6139,
        longitude: 77.2090,
        address: "Company Location"
      };

      for (const assignment of dateAssignments) {
        if (assignment.delivery_ids.length === 0) continue;

        const { data: deliveries, error } = await supabase
          .from('deliveries')
          .select('id, customer_address, latitude, longitude')
          .in('id', assignment.delivery_ids);

        if (error || !deliveries) continue;

        const { data: optimizationResult, error: optimizationError } = await supabase.functions.invoke('route-optimizer', {
          body: {
            deliveries: deliveries.map(d => ({
              id: d.id,
              address: d.customer_address,
              latitude: d.latitude,
              longitude: d.longitude
            })),
            startLocation
          }
        });

        if (optimizationError) {
          console.error('Optimization error for assignment:', assignment.id, optimizationError);
          continue;
        }

        await updateAssignmentMutation.mutateAsync({
          id: assignment.id,
          optimized_order: optimizationResult.optimizedOrder,
          total_distance: optimizationResult.totalDistance,
          estimated_duration: optimizationResult.totalDuration
        });
      }

      toast({
        title: "Routes Optimized",
        description: `All routes for ${new Date(date).toLocaleDateString()} have been optimized.`,
      });
    } catch (error) {
      console.error('Route optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize routes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [assignments, updateAssignmentMutation, toast]);

  return {
    dateRange,
    setDateRange,
    quickFilter,
    setQuickFilter,
    searchQuery,
    setSearchQuery,
    dateGroups,
    drivers,
    getAvailableDeliveriesForDate,
    getAssignedDeliveryIds,
    isLoading: assignmentsLoading || driversLoading || deliveriesLoading,
    isOptimizing,
    createAssignment: createAssignmentMutation.mutate,
    updateAssignment: updateAssignmentMutation.mutate,
    deleteAssignment: deleteAssignmentMutation.mutate,
    optimizeRoutesForDate,
    isCreating: createAssignmentMutation.isPending,
    isUpdating: updateAssignmentMutation.isPending,
    isDeleting: deleteAssignmentMutation.isPending
  };
};
