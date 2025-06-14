
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Clock, CheckCircle, Navigation, Camera, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddDeliveryDialog from './AddDeliveryDialog';

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  delivery_items: Array<{
    id: string;
    quantity: number;
    inventory: {
      product_name: string;
    };
  }>;
}

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
  current_mileage: number;
  fuel_type: string;
  status: string;
}

const DriverDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchDriverData();
    }
  }, [profile?.id]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      console.log('Fetching deliveries for date:', todayString);
      console.log('Driver ID:', profile?.id);
      
      // Fetch deliveries assigned to this driver for today or recent dates
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          *,
          delivery_items(
            id,
            quantity,
            inventory(product_name)
          )
        `)
        .eq('driver_id', profile?.id)
        .gte('scheduled_date', todayString) // Get today and future deliveries
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: true });

      console.log('Deliveries query result:', deliveriesData);
      console.log('Deliveries error:', deliveriesError);

      if (deliveriesError) throw deliveriesError;
      
      // Filter to show today's deliveries primarily, but also include recent ones if today is empty
      const todaysDeliveries = deliveriesData?.filter(d => d.scheduled_date === todayString) || [];
      
      console.log('Today\'s deliveries:', todaysDeliveries);
      console.log('All fetched deliveries:', deliveriesData);
      
      // If no deliveries for today, show all upcoming deliveries
      setDeliveries(todaysDeliveries.length > 0 ? todaysDeliveries : (deliveriesData || []));

      // Fetch assigned vehicle
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('vehicle_assignments')
        .select(`
          vehicle_id,
          vehicles(*)
        `)
        .eq('driver_id', profile?.id)
        .eq('is_active', true)
        .single();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        console.error('Assignment error:', assignmentError);
      } else if (assignmentData?.vehicles) {
        setVehicle(assignmentData.vehicles as Vehicle);
      }

    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast({
        title: "Error",
        description: "Failed to load driver data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;

      await fetchDriverData();
      toast({
        title: "Success",
        description: `Delivery ${newStatus === 'completed' ? 'completed' : 'started'}`,
      });
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive"
      });
    }
  };

  const handleNavigation = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  const handleProofUpload = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Proof of delivery upload will be available soon",
    });
  };

  // Updated function to handle successful delivery addition
  const handleDeliveryAdded = async () => {
    console.log('Delivery added successfully, refreshing data...');
    await fetchDriverData();
    toast({
      title: "Success",
      description: "Delivery route added successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completedCount = deliveries.filter(d => d.status === 'completed').length;
  const inProgressCount = deliveries.filter(d => d.status === 'in_progress').length;
  const pendingCount = deliveries.filter(d => d.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-600">Your routes and vehicle status for today</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            onClick={() => deliveries.length > 0 && handleNavigation(deliveries[0]?.customer_address)}
            disabled={deliveries.length === 0}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Start Navigation
          </Button>
          <Button variant="outline" onClick={handleProofUpload} className="w-full sm:w-auto">
            <Camera className="h-4 w-4 mr-2" />
            Upload Proof
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{inProgressCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vehicle</p>
                <p className="text-2xl font-bold text-blue-600">{vehicle ? 'Assigned' : 'None'}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Today's Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No routes scheduled for today</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Route
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery, index) => (
                <div 
                  key={delivery.id} 
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border ${
                    delivery.status === 'completed' ? 'bg-green-50 border-green-200' :
                    delivery.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                    'bg-white border-gray-200'
                  } hover:shadow-md transition-shadow space-y-3 sm:space-y-0`}
                >
                  <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      delivery.status === 'completed' ? 'bg-green-500' :
                      delivery.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                      <p className="text-sm text-gray-600">{delivery.customer_address}</p>
                      <p className="text-sm text-gray-500">
                        {delivery.delivery_items?.length || 0} items • #{delivery.delivery_number} • {delivery.scheduled_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      delivery.status === 'completed' ? 'bg-green-100 text-green-800' :
                      delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      delivery.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      {delivery.status === 'in_progress' && (
                        <Button 
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'completed')}
                          className="flex-1 sm:flex-none"
                        >
                          Complete Delivery
                        </Button>
                      )}
                      {delivery.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusUpdate(delivery.id, 'in_progress')}
                          className="flex-1 sm:flex-none"
                        >
                          Start Route
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleNavigation(delivery.customer_address)}
                        className="flex-none"
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      {vehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Vehicle Information - {vehicle.vehicle_number}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Model</p>
                <p className="font-medium">{vehicle.make} {vehicle.model}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Fuel Type</p>
                <p className="font-medium">{vehicle.fuel_type}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Mileage</p>
                <p className="font-medium">{vehicle.current_mileage.toLocaleString()} km</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600">{vehicle.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AddDeliveryDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleDeliveryAdded}
        driverId={profile?.id}
      />
    </div>
  );
};

export default DriverDashboard;
