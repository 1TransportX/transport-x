
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  fuel_type: string | null;
  current_mileage: number;
  status: 'active' | 'maintenance' | 'retired';
  last_service_date: string | null;
  next_service_due: number | null;
}

interface EditVehicleDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VehicleFormData {
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  fuel_type: string;
  current_mileage: number;
  fuel_economy: number;
  status: 'active' | 'maintenance' | 'retired';
  last_service_date?: string;
  next_service_due?: number;
}

const EditVehicleDialog: React.FC<EditVehicleDialogProps> = ({ vehicle, open, onOpenChange }) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<VehicleFormData>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (vehicle) {
      const fuelType = vehicle.fuel_type || '';
      reset({
        vehicle_number: vehicle.vehicle_number,
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        fuel_type: fuelType,
        current_mileage: vehicle.current_mileage,
        fuel_economy: 0,
        status: vehicle.status,
        last_service_date: vehicle.last_service_date || '',
        next_service_due: vehicle.next_service_due || undefined
      });
    }
  }, [vehicle, reset]);

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const { fuel_economy, ...vehicleData } = data;
      const { error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', vehicle.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast({
        title: "Success",
        description: "Vehicle updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update vehicle.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: VehicleFormData) => {
    updateVehicleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="vehicle_number">Vehicle Number</Label>
            <Input
              id="vehicle_number"
              {...register('vehicle_number', { required: true })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                {...register('make', { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                {...register('model', { required: true })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                {...register('year', { required: true, valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select value={watch('fuel_type')} onValueChange={(value) => setValue('fuel_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_mileage">Current Kilometers</Label>
              <Input
                id="current_mileage"
                type="number"
                {...register('current_mileage', { required: true, valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="fuel_economy">Fuel Economy (Km/L)</Label>
              <Input
                id="fuel_economy"
                type="number"
                step="0.1"
                {...register('fuel_economy', { valueAsNumber: true })}
                placeholder="12.5"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="last_service_date">Last Service Date</Label>
              <Input
                id="last_service_date"
                type="date"
                {...register('last_service_date')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="next_service_due">Next Service Due (km)</Label>
            <Input
              id="next_service_due"
              type="number"
              {...register('next_service_due', { valueAsNumber: true })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateVehicleMutation.isPending}>
              {updateVehicleMutation.isPending ? 'Updating...' : 'Update Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVehicleDialog;
