
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Package } from 'lucide-react';
import { useDailyRouteAssignments } from '@/hooks/useDailyRouteAssignments';
import { useAuth } from '@/hooks/useAuth';

interface CreateDailyAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  availableDeliveries: any[];
  drivers: any[];
}

const CreateDailyAssignmentDialog: React.FC<CreateDailyAssignmentDialogProps> = ({
  open,
  onOpenChange,
  selectedDate,
  availableDeliveries,
  drivers
}) => {
  const { profile } = useAuth();
  const { createAssignment, isCreating } = useDailyRouteAssignments();
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!selectedDriver || selectedDeliveries.length === 0) {
      return;
    }

    createAssignment({
      assignment_date: selectedDate,
      driver_id: selectedDriver,
      delivery_ids: selectedDeliveries,
      optimized_order: [],
      total_distance: 0,
      estimated_duration: 0,
      status: 'planned',
      created_by: profile?.id || ''
    });

    // Reset form
    setSelectedDriver('');
    setSelectedDeliveries([]);
    onOpenChange(false);
  };

  const handleDeliveryToggle = (deliveryId: string) => {
    setSelectedDeliveries(prev =>
      prev.includes(deliveryId)
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeliveries.length === availableDeliveries.length) {
      setSelectedDeliveries([]);
    } else {
      setSelectedDeliveries(availableDeliveries.map(d => d.id));
    }
  };

  const autoAssignByLocation = () => {
    // Simple clustering algorithm - group by similar coordinates
    const clusters = [];
    const deliveriesWithCoords = availableDeliveries.filter(d => d.latitude && d.longitude);
    
    if (deliveriesWithCoords.length === 0) {
      setSelectedDeliveries(availableDeliveries.map(d => d.id));
      return;
    }

    // For now, just take a reasonable chunk of deliveries
    const chunkSize = Math.ceil(availableDeliveries.length / drivers.length);
    const chunk = availableDeliveries.slice(0, chunkSize);
    setSelectedDeliveries(chunk.map(d => d.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Daily Route Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Driver Selection */}
          <div>
            <Label htmlFor="driver">Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {driver.first_name} {driver.last_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Select Deliveries ({selectedDeliveries.length} selected)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoAssignByLocation}
                  disabled={availableDeliveries.length === 0}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Smart Assign
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={availableDeliveries.length === 0}
                >
                  {selectedDeliveries.length === availableDeliveries.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            {availableDeliveries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No deliveries available for {new Date(selectedDate).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {availableDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedDeliveries.includes(delivery.id)}
                      onCheckedChange={() => handleDeliveryToggle(delivery.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{delivery.delivery_number}</Badge>
                        <span className="font-medium text-sm">{delivery.customer_name}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {delivery.customer_address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedDeliveries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assignment Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Driver:</span>
                    <p className="font-medium">
                      {selectedDriver ? drivers.find(d => d.id === selectedDriver)?.first_name + ' ' + drivers.find(d => d.id === selectedDriver)?.last_name : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Deliveries:</span>
                    <p className="font-medium">{selectedDeliveries.length} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDriver || selectedDeliveries.length === 0 || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDailyAssignmentDialog;
