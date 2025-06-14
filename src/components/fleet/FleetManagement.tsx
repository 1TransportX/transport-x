import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Truck, Fuel, Wrench, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddVehicleDialog from './AddVehicleDialog';
import EditVehicleDialog from './EditVehicleDialog';
import VehicleTrackingDialog from './VehicleTrackingDialog';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  fuel_type: string | null;
  current_mileage: number;
  fuel_economy: number | null;
  status: 'active' | 'maintenance' | 'retired';
  last_service_date: string | null;
  next_service_due: number | null;
}

const FleetManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [trackingVehicle, setTrackingVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  console.log('FleetManagement: Component rendering');

  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      console.log('FleetManagement: Fetching vehicles...');
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('FleetManagement: Error fetching vehicles:', error);
          throw error;
        }
        
        console.log('FleetManagement: Fetched vehicles:', data);
        return (data || []) as Vehicle[];
      } catch (error) {
        console.error('FleetManagement: Query error:', error);
        throw error;
      }
    }
  });

  console.log('FleetManagement: isLoading:', isLoading, 'vehicles:', vehicles?.length, 'error:', error);

  const stats = useMemo(() => {
    console.log('FleetManagement: Computing stats for vehicles:', vehicles?.length);
    
    if (!vehicles || vehicles.length === 0) {
      return {
        total: 0,
        active: 0,
        maintenance: 0,
        avgKilometers: 0
      };
    }

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    const avgKilometers = totalVehicles > 0 
      ? Math.round(vehicles.reduce((sum, v) => sum + (v.current_mileage || 0), 0) / totalVehicles)
      : 0;

    const result = {
      total: totalVehicles,
      active: activeVehicles,
      maintenance: maintenanceVehicles,
      avgKilometers
    };
    
    console.log('FleetManagement: Computed stats:', result);
    return result;
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    console.log('FleetManagement: Filtering vehicles, searchTerm:', searchTerm);
    
    if (!vehicles) {
      console.log('FleetManagement: No vehicles to filter');
      return [];
    }
    
    const filtered = vehicles.filter(vehicle =>
      vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('FleetManagement: Filtered vehicles count:', filtered.length);
    return filtered;
  }, [vehicles, searchTerm]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    console.error('FleetManagement: Rendering error state:', error);
    return (
      <div className="p-6">
        <div className="text-red-600">
          Error loading fleet data: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log('FleetManagement: Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('FleetManagement: Rendering main content');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fleet Management</h1>
          <p className="text-gray-600 mt-2">Monitor vehicles, routes, and maintenance schedules.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wrench className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Maintenance</p>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Fuel className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Kilometers</p>
                <p className="text-2xl font-bold">{stats.avgKilometers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Number</TableHead>
                <TableHead>Make & Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Kilometers</TableHead>
                <TableHead>Fuel Economy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Service</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No vehicles found. Add a vehicle to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                    <TableCell>
                      {vehicle.make && vehicle.model 
                        ? `${vehicle.make} ${vehicle.model}`
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>{vehicle.year || 'N/A'}</TableCell>
                    <TableCell>{vehicle.fuel_type || 'N/A'}</TableCell>
                    <TableCell>{(vehicle.current_mileage || 0).toLocaleString()} km</TableCell>
                    <TableCell>
                      {vehicle.fuel_economy ? `${vehicle.fuel_economy} Km/L` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.last_service_date 
                        ? new Date(vehicle.last_service_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingVehicle(vehicle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTrackingVehicle(vehicle)}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddVehicleDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
      
      {editingVehicle && (
        <EditVehicleDialog 
          vehicle={editingVehicle}
          open={!!editingVehicle}
          onOpenChange={(open) => !open && setEditingVehicle(null)}
        />
      )}

      {trackingVehicle && (
        <VehicleTrackingDialog 
          vehicle={trackingVehicle}
          open={!!trackingVehicle}
          onOpenChange={(open) => !open && setTrackingVehicle(null)}
        />
      )}
    </div>
  );
};

export default FleetManagement;
