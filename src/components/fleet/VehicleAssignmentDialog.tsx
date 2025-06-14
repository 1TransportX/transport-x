
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string | null;
  model: string | null;
  status: 'active' | 'maintenance' | 'retired';
}

interface VehicleAssignmentDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CurrentAssignment {
  id: string;
  driver_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({ 
  vehicle, 
  open, 
  onOpenChange 
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'driver')
        .eq('is_active', true);

      if (error) throw error;
      return data as Driver[];
    },
    enabled: open
  });

  // Fetch current assignment
  const { data: currentAssignment } = useQuery({
    queryKey: ['vehicle-assignment', vehicle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          profiles:driver_id (
            first_name,
            last_name
          )
        `)
        .eq('vehicle_id', vehicle.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as CurrentAssignment | null;
    },
    enabled: open
  });

  // Assign vehicle mutation
  const assignVehicleMutation = useMutation({
    mutationFn: async (driverId: string) => {
      // First, unassign current driver if exists
      if (currentAssignment) {
        await supabase
          .from('vehicle_assignments')
          .update({ 
            is_active: false, 
            unassigned_date: new Date().toISOString().split('T')[0] 
          })
          .eq('id', currentAssignment.id);
      }

      // Then assign new driver
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .insert({
          vehicle_id: vehicle.id,
          driver_id: driverId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Vehicle Assigned",
        description: "Vehicle has been successfully assigned to the driver.",
      });
      onOpenChange(false);
      setSelectedDriverId('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign vehicle.",
        variant: "destructive",
      });
    }
  });

  // Unassign vehicle mutation
  const unassignVehicleMutation = useMutation({
    mutationFn: async () => {
      if (!currentAssignment) return;

      const { error } = await supabase
        .from('vehicle_assignments')
        .update({ 
          is_active: false, 
          unassigned_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', currentAssignment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Vehicle Unassigned",
        description: "Vehicle has been successfully unassigned.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to unassign vehicle.",
        variant: "destructive",
      });
    }
  });

  const handleAssign = () => {
    if (!selectedDriverId) {
      toast({
        title: "Error",
        description: "Please select a driver to assign.",
        variant: "destructive",
      });
      return;
    }
    assignVehicleMutation.mutate(selectedDriverId);
  };

  const handleUnassign = () => {
    unassignVehicleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Vehicle - {vehicle.vehicle_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {currentAssignment && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Currently Assigned To:</h3>
              <p className="text-blue-800">
                {currentAssignment.profiles.first_name} {currentAssignment.profiles.last_name}
              </p>
              <Button
                variant="outline"
                onClick={handleUnassign}
                disabled={unassignVehicleMutation.isPending}
                className="mt-2"
              >
                {unassignVehicleMutation.isPending ? 'Unassigning...' : 'Unassign Vehicle'}
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="driver-select">
              {currentAssignment ? 'Reassign to Different Driver:' : 'Assign to Driver:'}
            </Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger id="driver-select">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name} ({driver.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={assignVehicleMutation.isPending || !selectedDriverId}
            >
              {assignVehicleMutation.isPending ? 'Assigning...' : 'Assign Vehicle'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleAssignmentDialog;
