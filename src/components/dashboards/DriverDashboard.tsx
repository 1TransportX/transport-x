
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Camera, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddDeliveryDialog from './AddDeliveryDialog';
import DeliveryCompletionDialog from '../deliveries/DeliveryCompletionDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import DashboardOverview from './driver/DashboardOverview';
import DeliveryRoutes from './driver/DeliveryRoutes';
import VehicleInfo from './driver/VehicleInfo';
import { useQuery } from '@tanstack/react-query';

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  // Fetch daily route assignments for this driver
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['driver-assignments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('daily_route_assignments')
        .select('*')
        .eq('driver_id', profile.id)
        .order('assignment_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch all deliveries for the assigned delivery_ids
  const deliveryIds = assignments.flatMap(a => a.delivery_ids || []);
  const { data: deliveries = [], isLoading: deliveriesLoading, refetch: refetchDeliveries } = useQuery({
    queryKey: ['driver-deliveries', deliveryIds],
    queryFn: async () => {
      if (deliveryIds.length === 0) return [];
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .in('id', deliveryIds);
      if (error) throw error;
      return data;
    },
    enabled: deliveryIds.length > 0
  });

  // Combine and order deliveries by assignment's optimized_order
  const today = new Date().toISOString().split('T')[0];
  const todayAssignment = assignments.find(a => a.assignment_date === today);
  let todaysDeliveries: Delivery[] = [];
  if (todayAssignment && deliveries.length > 0) {
    todaysDeliveries = (todayAssignment.optimized_order || [])
      .map((idx: number) => deliveries.find(d => d.id === todayAssignment.delivery_ids[idx]))
      .filter(Boolean) as Delivery[];
  }
  // All assigned deliveries (flattened)
  const allDeliveries: Delivery[] = deliveries;

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

      await refetchDeliveries();
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
    await refetchDeliveries();
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
    await refetchDeliveries();
    toast({
      title: "Success",
      description: "Delivery route added successfully",
    });
  };

  // Check if still loading
  if (assignmentsLoading || deliveriesLoading) {
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
