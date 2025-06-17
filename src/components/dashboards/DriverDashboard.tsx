
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation, Camera, Plus, Truck, Route } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddDeliveryDialog from './AddDeliveryDialog';
import DeliveryCompletionDialog from '../deliveries/DeliveryCompletionDialog';
import RouteManagement from '../transportation/RouteManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import DashboardOverview from './driver/DashboardOverview';
import DeliveryRoutes from './driver/DeliveryRoutes';
import VehicleInfo from './driver/VehicleInfo';

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
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (profile?.id) {
      fetchDriverData();
    }
  }, [profile?.id]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver_id', profile?.id)
        .gte('scheduled_date', todayString)
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (deliveriesError) throw deliveriesError;
      
      const todaysRoutes = deliveriesData?.filter(d => d.scheduled_date === todayString) || [];
      
      setTodaysDeliveries(todaysRoutes);
      setAllDeliveries(deliveriesData || []);

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
      const delivery = todaysDeliveries.find(d => d.id === deliveryId) || 
                      allDeliveries.find(d => d.id === deliveryId);
      if (delivery) {
        setSelectedDelivery(delivery);
        setCompletionDialogOpen(true);
      }
      return;
    }

    try {
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

  const handleDeliveryAdded = async () => {
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

  const completedCount = todaysDeliveries.filter(d => d.status === 'completed').length;
  const inProgressCount = todaysDeliveries.filter(d => d.status === 'in_progress').length;

  return (
    <div className={`${isMobile ? 'p-3 space-y-4' : 'p-6 space-y-6'}`}>
      <ResponsiveHeader
        title="Driver Dashboard"
        subtitle="Your routes and vehicle status"
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-12' : 'h-10'}`}>
          <TabsTrigger 
            value="dashboard" 
            className={`flex items-center gap-2 ${isMobile ? 'text-sm px-3' : 'text-sm'}`}
          >
            <Truck className="h-4 w-4" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="routes" 
            className={`flex items-center gap-2 ${isMobile ? 'text-sm px-3' : 'text-sm'}`}
          >
            <Route className="h-4 w-4" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Routes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <DashboardOverview
            totalDeliveries={todaysDeliveries.length}
            completedCount={completedCount}
            inProgressCount={inProgressCount}
            vehicle={vehicle}
          />

          <DeliveryRoutes
            todaysDeliveries={todaysDeliveries}
            allDeliveries={allDeliveries}
            onStatusUpdate={handleStatusUpdate}
            onNavigation={handleNavigation}
            onAddRoute={() => setIsAddDialogOpen(true)}
          />

          {vehicle && <VehicleInfo vehicle={vehicle} />}
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <RouteManagement />
        </TabsContent>
      </Tabs>

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
