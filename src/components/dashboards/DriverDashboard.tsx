import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Truck, Clock, CheckCircle, Navigation, Camera, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddDeliveryDialog from './AddDeliveryDialog';
import DeliveryCompletionDialog from '../deliveries/DeliveryCompletionDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveHeader } from '@/components/ui/responsive-header';

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
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
  const isMobile = useIsMobile();
  const [todaysDeliveries, setTodaysDeliveries] = useState<Delivery[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

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
      
      // Fetch all deliveries assigned to this driver (without delivery_items)
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver_id', profile?.id)
        .gte('scheduled_date', todayString)
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: true });

      console.log('Deliveries query result:', deliveriesData);
      console.log('Deliveries error:', deliveriesError);

      if (deliveriesError) throw deliveriesError;
      
      // Filter today's deliveries
      const todaysRoutes = deliveriesData?.filter(d => d.scheduled_date === todayString) || [];
      
      console.log('Today\'s deliveries:', todaysRoutes);
      console.log('All fetched deliveries:', deliveriesData);
      
      setTodaysDeliveries(todaysRoutes);
      setAllDeliveries(deliveriesData || []);

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

  const handleStatusUpdate = async (deliveryId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    if (newStatus === 'completed') {
      // Find the delivery and open completion dialog
      const delivery = todaysDeliveries.find(d => d.id === deliveryId) || 
                      allDeliveries.find(d => d.id === deliveryId);
      if (delivery) {
        setSelectedDelivery(delivery);
        setCompletionDialogOpen(true);
      }
      return;
    }

    try {
      // Only update the status, don't try to update non-existent started_at column
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus })
        .eq('id', deliveryId);

      if (error) throw error;

      await fetchDriverData();
      toast({
        title: "Success",
        description: `Delivery ${newStatus === 'in_progress' ? 'started' : 'updated'}`,
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

  const handleCompletionSuccess = async () => {
    setCompletionDialogOpen(false);
    setSelectedDelivery(null);
    await fetchDriverData();
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

  const renderDeliveryCard = (delivery: Delivery, index: number) => (
    <div 
      key={delivery.id} 
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border ${
        delivery.status === 'completed' ? 'bg-green-50 border-green-200' :
        delivery.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
        'bg-white border-gray-200'
      } hover:shadow-md transition-shadow space-y-3 sm:space-y-0`}
    >
      <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
          delivery.status === 'completed' ? 'bg-green-500' :
          delivery.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 sm:flex-none">
          <p className="font-medium text-gray-900 text-sm sm:text-base">{delivery.customer_name}</p>
          <p className="text-xs sm:text-sm text-gray-600 break-words">{delivery.customer_address}</p>
          <p className="text-xs text-gray-500">
            #{delivery.delivery_number} • {delivery.scheduled_date}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
          delivery.status === 'completed' ? 'bg-green-100 text-green-800' :
          delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          delivery.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {delivery.status.replace('_', ' ')}
        </span>
        <div className="flex space-x-1 sm:space-x-2 w-full sm:w-auto">
          {delivery.status === 'in_progress' && (
            <Button 
              size="sm"
              onClick={() => handleStatusUpdate(delivery.id, 'completed')}
              className="flex-1 sm:flex-none text-xs"
            >
              Complete
            </Button>
          )}
          {delivery.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleStatusUpdate(delivery.id, 'in_progress')}
              className="flex-1 sm:flex-none text-xs"
            >
              Start
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleNavigation(delivery.customer_address)}
            className="flex-none p-1 sm:p-2"
          >
            <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completedCount = todaysDeliveries.filter(d => d.status === 'completed').length;
  const inProgressCount = todaysDeliveries.filter(d => d.status === 'in_progress').length;
  const pendingCount = todaysDeliveries.filter(d => d.status === 'pending').length;

  return (
    <div className={`${isMobile ? 'p-3 space-y-4' : 'p-6 space-y-6'}`}>
      <ResponsiveHeader
        title="Driver Dashboard"
        subtitle="Your routes and vehicle status for today"
      >
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => todaysDeliveries.length > 0 && handleNavigation(todaysDeliveries[0]?.customer_address)}
          disabled={todaysDeliveries.length === 0}
          size={isMobile ? "sm" : "default"}
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isMobile ? 'Navigate' : 'Start Navigation'}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleProofUpload}
          size={isMobile ? "sm" : "default"}
        >
          <Camera className="h-4 w-4 mr-2" />
          {isMobile ? 'Upload' : 'Upload Proof'}
        </Button>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? 'Add' : 'Add Route'}
        </Button>
      </ResponsiveHeader>

      {/* Status Overview - Updated to 2x2 grid on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Today</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{todaysDeliveries.length}</p>
              </div>
              <MapPin className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-lg md:text-2xl font-bold text-orange-600">{inProgressCount}</p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Vehicle</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">{vehicle ? 'Assigned' : 'None'}</p>
              </div>
              <Truck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes Tabs */}
      <Card>
        <CardHeader className={isMobile ? 'p-4 pb-2' : 'p-6'}>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Route Management
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className={`${isMobile ? 'w-full' : 'grid w-full'} grid-cols-2`}>
              <TabsTrigger value="today" className={isMobile ? 'text-xs' : ''}>Today's Routes</TabsTrigger>
              <TabsTrigger value="scheduled" className={isMobile ? 'text-xs' : ''}>All Scheduled</TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
              {todaysDeliveries.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className={`text-gray-500 mb-4 ${isMobile ? 'text-sm' : ''}`}>No routes scheduled for today</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} size={isMobile ? "sm" : "default"}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Route
                  </Button>
                </div>
              ) : (
                <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                  {todaysDeliveries.map((delivery, index) => renderDeliveryCard(delivery, index))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="scheduled" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
              {allDeliveries.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className={`text-gray-500 mb-4 ${isMobile ? 'text-sm' : ''}`}>No scheduled routes found</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} size={isMobile ? "sm" : "default"}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Route
                  </Button>
                </div>
              ) : (
                <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                  {allDeliveries.map((delivery, index) => renderDeliveryCard(delivery, index))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Vehicle Information - Updated to 2x2 grid on mobile */}
      {vehicle && (
        <Card>
          <CardHeader className={isMobile ? 'p-4 pb-2' : 'p-6'}>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Vehicle Information - {vehicle.vehicle_number}
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Model</p>
                <p className="font-medium text-sm md:text-base">{vehicle.make} {vehicle.model}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Fuel Type</p>
                <p className="font-medium text-sm md:text-base">{vehicle.fuel_type}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Mileage</p>
                <p className="font-medium text-sm md:text-base">{vehicle.current_mileage.toLocaleString()} km</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600 text-sm md:text-base">{vehicle.status}</p>
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

      {selectedDelivery && (
        <DeliveryCompletionDialog
          isOpen={completionDialogOpen}
          onClose={() => {
            setCompletionDialogOpen(false);
            setSelectedDelivery(null);
          }}
          delivery={selectedDelivery}
          vehicleId={vehicle?.id}
          driverId={profile?.id || ''}
          currentMileage={vehicle?.current_mileage || 0}
          onComplete={handleCompletionSuccess}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
