
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddVehicleDialogProps {
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

const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<VehicleFormData>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const { error } = await supabase
        .from('vehicles')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast({
        title: "Success",
        description: "Vehicle added successfully.",
      });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add vehicle.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: VehicleFormData) => {
    addVehicleMutation.mutate(data);
  };

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setValue('vehicle_number', value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="vehicle_number">Vehicle Number</Label>
            <Input
              id="vehicle_number"
              value={watch('vehicle_number') || ''}
              onChange={handleVehicleNumberChange}
              placeholder="VH001"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                {...register('make', { required: true })}
                placeholder="Ford"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                {...register('model', { required: true })}
                placeholder="Transit"
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
                placeholder="2023"
              />
            </div>
            <div>
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select onValueChange={(value) => setValue('fuel_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
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
                placeholder="80000"
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
              <Select onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
              placeholder="88000"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addVehicleMutation.isPending}>
              {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
