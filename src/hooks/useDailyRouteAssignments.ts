
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useDailyRouteAssignments = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignments for selected date
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['daily-route-assignments', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_route_assignments')
        .select('*')
        .eq('assignment_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DailyRouteAssignment[];
    }
  });

  // Fetch available drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', [
          // Get users with driver or admin role
          supabase
            .from('user_roles')
            .select('user_id')
            .in('role', ['driver', 'admin'])
        ]);

      if (error) throw error;
      return data as DriverForAssignment[];
    }
  });

  // Fetch available deliveries for the date
  const { data: availableDeliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['deliveries-for-assignment', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, customer_name, customer_address, delivery_number, status, latitude, longitude')
        .eq('scheduled_date', selectedDate)
        .eq('status', 'pending');

      if (error) throw error;
      return data as DeliveryForAssignment[];
    }
  });

  // Create or update assignment
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: Omit<DailyRouteAssignment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('daily_route_assignments')
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-route-assignments'] });
      toast({
        title: "Assignment Created",
        description: "Daily route assignment has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assignment.",
        variant: "destructive",
      });
    }
  });

  // Update assignment
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
      queryClient.invalidateQueries({ queryKey: ['daily-route-assignments'] });
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

  // Delete assignment
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_route_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-route-assignments'] });
      toast({
        title: "Assignment Deleted",
        description: "Daily route assignment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete assignment.",
        variant: "destructive",
      });
    }
  });

  // Optimize routes for all drivers on selected date
  const optimizeAllRoutes = useCallback(async () => {
    if (assignments.length === 0) {
      toast({
        title: "No assignments",
        description: "Please create assignments first.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const startLocation = {
        latitude: 28.6139, // Default Delhi coordinates
        longitude: 77.2090,
        address: "Company Location"
      };

      for (const assignment of assignments) {
        if (assignment.delivery_ids.length === 0) continue;

        // Get delivery details for optimization
        const { data: deliveries, error } = await supabase
          .from('deliveries')
          .select('id, customer_address, latitude, longitude')
          .in('id', assignment.delivery_ids);

        if (error || !deliveries) continue;

        // Call route optimizer
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

        // Update assignment with optimized route
        await updateAssignmentMutation.mutateAsync({
          id: assignment.id,
          optimized_order: optimizationResult.optimizedOrder,
          total_distance: optimizationResult.totalDistance,
          estimated_duration: optimizationResult.totalDuration
        });
      }

      toast({
        title: "Routes Optimized",
        description: "All routes have been optimized successfully.",
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
    selectedDate,
    setSelectedDate,
    assignments,
    drivers,
    availableDeliveries,
    isLoading: assignmentsLoading || driversLoading || deliveriesLoading,
    isOptimizing,
    createAssignment: createAssignmentMutation.mutate,
    updateAssignment: updateAssignmentMutation.mutate,
    deleteAssignment: deleteAssignmentMutation.mutate,
    optimizeAllRoutes,
    isCreating: createAssignmentMutation.isPending,
    isUpdating: updateAssignmentMutation.isPending,
    isDeleting: deleteAssignmentMutation.isPending
  };
};
