
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Package } from 'lucide-react';

interface AssignRouteToDriverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: string;
  driver_id: string | null;
}

const AssignRouteToDriverDialog: React.FC<AssignRouteToDriverDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      fetchUnassignedDeliveries();
    }
  }, [isOpen]);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          user_roles(role)
        `)
        .eq('is_active', true);

      if (error) throw error;

      const driverProfiles = data.filter(profile => 
        profile.user_roles?.role === 'driver'
      );

      setDrivers(driverProfiles);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive"
      });
    }
  };

  const fetchUnassignedDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load deliveries",
        variant: "destructive"
      });
    }
  };

  const getAvailableDriversForDeliveries = async (deliveryIds: string[]) => {
    if (deliveryIds.length === 0) return drivers;

    try {
      // Get the scheduled dates for selected deliveries
      const selectedDeliveryData = deliveries.filter(d => deliveryIds.includes(d.id));
      const scheduledDates = [...new Set(selectedDeliveryData.map(d => d.scheduled_date))];

      if (scheduledDates.length === 0) return drivers;

      // Fetch approved leave requests that overlap with any of the scheduled dates
      const { data: leaveRequests, error } = await supabase
        .from('leave_requests')
        .select('user_id, start_date, end_date')
        .eq('status', 'approved')
        .or(
          scheduledDates.map(date => 
            `and(lte.start_date.${date},gte.end_date.${date})`
          ).join(',')
        );

      if (error) {
        console.error('Error fetching leave requests:', error);
        return drivers;
      }

      // Get user IDs that are on leave during any of the scheduled dates
      const driversOnLeave = new Set<string>();
      
      leaveRequests?.forEach(leave => {
        scheduledDates.forEach(date => {
          if (date >= leave.start_date && date <= leave.end_date) {
            driversOnLeave.add(leave.user_id);
          }
        });
      });

      // Filter out drivers who are on leave
      return drivers.filter(driver => !driversOnLeave.has(driver.id));
    } catch (error) {
      console.error('Error checking driver availability:', error);
      return drivers;
    }
  };

  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const updateAvailableDrivers = async () => {
      const available = await getAvailableDriversForDeliveries(selectedDeliveries);
      setAvailableDrivers(available);
      
      // Clear selected driver if they're no longer available
      if (selectedDriver && !available.find(d => d.id === selectedDriver)) {
        setSelectedDriver('');
      }
    };

    updateAvailableDrivers();
  }, [selectedDeliveries, drivers]);

  const handleAssignRoutes = async () => {
    if (!selectedDriver || selectedDeliveries.length === 0) {
      toast({
        title: "Error",
        description: "Please select a driver and at least one delivery",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ driver_id: selectedDriver })
        .in('id', selectedDeliveries);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully assigned ${selectedDeliveries.length} delivery routes to driver`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error assigning routes:', error);
      toast({
        title: "Error",
        description: "Failed to assign routes to driver",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDriver('');
    setSelectedDeliveries([]);
  };

  const toggleDeliverySelection = (deliveryId: string) => {
    setSelectedDeliveries(prev => 
      prev.includes(deliveryId)
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Routes to Driver</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="driver_select">Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name} ({driver.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDeliveries.length > 0 && availableDrivers.length < drivers.length && (
              <p className="text-sm text-amber-600 mt-1">
                Some drivers are unavailable due to approved leave requests for the selected delivery dates.
              </p>
            )}
          </div>

          <div>
            <Label className="text-lg font-semibold">Available Delivery Routes</Label>
            <p className="text-sm text-gray-600 mb-4">
              Select delivery routes to assign to the chosen driver. Click on routes to select them.
            </p>
            
            {deliveries.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No delivery routes available for assignment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {deliveries.map((delivery) => (
                  <Card 
                    key={delivery.id}
                    className={`cursor-pointer transition-all ${
                      selectedDeliveries.includes(delivery.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleDeliverySelection(delivery.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{delivery.delivery_number}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                            {delivery.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {delivery.driver_id && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                              ASSIGNED
                            </span>
                          )}
                        </div>
                      </div>
                      <CardDescription className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(delivery.scheduled_date).toLocaleDateString()}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                          <div>
                            <p className="font-medium">{delivery.customer_name}</p>
                            <p className="text-sm text-gray-600">{delivery.customer_address}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {selectedDeliveries.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                Selected {selectedDeliveries.length} delivery route{selectedDeliveries.length > 1 ? 's' : ''} for assignment
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRoutes}
              disabled={loading || !selectedDriver || selectedDeliveries.length === 0}
            >
              {loading ? 'Assigning...' : `Assign ${selectedDeliveries.length} Route${selectedDeliveries.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRouteToDriverDialog;
