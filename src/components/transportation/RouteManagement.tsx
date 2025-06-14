import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Package, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddDeliveryDialog from '@/components/dashboards/AddDeliveryDialog';

interface Delivery {
  id: string;
  delivery_number: string;
  customer_name: string;
  customer_address: string;
  scheduled_date: string;
  status: string;
  driver_id: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  delivery_items: Array<{
    quantity: number;
    inventory: {
      product_name: string;
    };
  }>;
}

const RouteManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDeliveryDialog, setShowAddDeliveryDialog] = useState(false);
  const { toast } = useToast();

  console.log('RouteManagement: Component rendering');

  const { data: deliveries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['routes-deliveries'],
    queryFn: async () => {
      console.log('RouteManagement: Fetching deliveries...');
      try {
        const { data, error } = await supabase
          .from('deliveries')
          .select(`
            id,
            delivery_number,
            customer_name,
            customer_address,
            scheduled_date,
            status,
            driver_id,
            profiles:driver_id(first_name, last_name),
            delivery_items(
              quantity,
              inventory(product_name)
            )
          `)
          .order('scheduled_date', { ascending: true });

        if (error) {
          console.error('RouteManagement: Error fetching deliveries:', error);
          throw error;
        }
        
        console.log('RouteManagement: Fetched deliveries:', data);
        return (data || []) as Delivery[];
      } catch (error) {
        console.error('RouteManagement: Query error:', error);
        throw error;
      }
    }
  });

  const stats = useMemo(() => {
    if (!deliveries || deliveries.length === 0) {
      return {
        total: 0,
        assigned: 0,
        unassigned: 0,
        completed: 0
      };
    }

    const totalRoutes = deliveries.length;
    const assignedRoutes = deliveries.filter(d => d.driver_id).length;
    const unassignedRoutes = deliveries.filter(d => !d.driver_id).length;
    const completedRoutes = deliveries.filter(d => d.status === 'completed').length;

    return {
      total: totalRoutes,
      assigned: assignedRoutes,
      unassigned: unassignedRoutes,
      completed: completedRoutes
    };
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    
    return deliveries.filter(delivery =>
      delivery.delivery_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customer_address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [deliveries, searchTerm]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">
          Error loading route data: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold">{stats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold">{stats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Delivery Routes ({filteredDeliveries.length})</CardTitle>
            </div>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowAddDeliveryDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Route
            </Button>
          </div>
          <Input
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Assigned Driver</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No delivery routes found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                    <TableCell>{delivery.customer_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{delivery.customer_address}</TableCell>
                    <TableCell>
                      {new Date(delivery.scheduled_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {delivery.profiles 
                        ? `${delivery.profiles.first_name} ${delivery.profiles.last_name}`
                        : 'Unassigned'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {delivery.delivery_items?.length > 0 ? (
                          delivery.delivery_items.map((item, index) => (
                            <div key={index}>
                              {item.quantity}x {item.inventory?.product_name}
                            </div>
                          ))
                        ) : (
                          'No items'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(delivery.status)}>
                        {delivery.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddDeliveryDialog 
        isOpen={showAddDeliveryDialog}
        onClose={() => setShowAddDeliveryDialog(false)}
        onSuccess={() => {
          setShowAddDeliveryDialog(false);
          refetch(); // Refresh the deliveries list
        }}
      />
    </div>
  );
};

export default RouteManagement;
