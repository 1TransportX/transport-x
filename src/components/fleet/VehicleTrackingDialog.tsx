
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, User, Clock } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string | null;
  model: string | null;
  status: 'active' | 'maintenance' | 'retired';
}

interface VehicleTrackingDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehicleTrackingDialog: React.FC<VehicleTrackingDialogProps> = ({ vehicle, open, onOpenChange }) => {
  // Fetch current driver assignment
  const { data: assignment } = useQuery({
    queryKey: ['vehicle-tracking-assignment', vehicle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', data.driver_id)
        .single();

      return {
        ...data,
        profiles: profileData || { first_name: '', last_name: '', phone: '' }
      };
    },
    enabled: open
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vehicle Tracking - {vehicle.vehicle_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Assigned Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignment ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {assignment.profiles.first_name} {assignment.profiles.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{assignment.profiles.phone}</p>
                  <p className="text-sm text-gray-600">
                    Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">No driver currently assigned</p>
                  <p className="text-sm text-gray-400">Assign a driver to enable tracking</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-2">GPS tracking coming soon</p>
                <p className="text-sm text-gray-400">
                  Real-time vehicle location tracking will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleTrackingDialog;
