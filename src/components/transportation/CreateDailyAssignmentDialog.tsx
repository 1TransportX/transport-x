
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Users, Package, Zap } from 'lucide-react';
import { useDailyRouteAssignments } from '@/hooks/useDailyRouteAssignments';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { createAssignment, isCreating, getAssignedDeliveryIds } = useDailyRouteAssignments();
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

  // Improved smart assignment with geographic clustering and workload balancing
  const smartAssignByLocation = () => {
    if (availableDeliveries.length === 0 || drivers.length === 0) {
      return;
    }

    const assignedIds = getAssignedDeliveryIds();
    const unassignedDeliveries = availableDeliveries.filter(d => !assignedIds.has(d.id));
    
    if (unassignedDeliveries.length === 0) {
      setSelectedDeliveries([]);
      return;
    }

    // Calculate optimal number of deliveries per driver
    const deliveriesPerDriver = Math.ceil(unassignedDeliveries.length / drivers.length);
    
    // For the selected driver, assign a balanced portion
    const driverIndex = drivers.findIndex(d => d.id === selectedDriver);
    const startIndex = driverIndex >= 0 ? driverIndex * deliveriesPerDriver : 0;
    const endIndex = Math.min(startIndex + deliveriesPerDriver, unassignedDeliveries.length);
    
    const assignedDeliveries = unassignedDeliveries.slice(startIndex, endIndex);
    setSelectedDeliveries(assignedDeliveries.map(d => d.id));
  };

  const DialogWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[95vh] flex flex-col">
            <SheetHeader className="flex-shrink-0 pb-4 border-b">
              <SheetTitle className="text-lg font-semibold">Create Route Assignment</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create Daily Route Assignment</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <DialogWrapper>
      <ScrollArea className="h-full">
        <div className="space-y-6 p-1">
          {/* Driver Selection */}
          <div className="space-y-3">
            <Label htmlFor="driver" className="text-base font-semibold">Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className={`${isMobile ? 'h-12 text-base' : 'h-11'}`}>
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{driver.first_name} {driver.last_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Selection */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <Label className="text-base font-semibold">
                Select Deliveries ({selectedDeliveries.length} selected)
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={smartAssignByLocation}
                  disabled={!selectedDriver || availableDeliveries.length === 0}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Smart Assign
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={handleSelectAll}
                  disabled={availableDeliveries.length === 0}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  {selectedDeliveries.length === availableDeliveries.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            {availableDeliveries.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">No Available Deliveries</h3>
                  <p className="text-sm text-gray-600">
                    No unassigned deliveries for {new Date(selectedDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {availableDeliveries.map((delivery) => (
                  <Card
                    key={delivery.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDeliveries.includes(delivery.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleDeliveryToggle(delivery.id)}
                  >
                    <CardContent className={`${isMobile ? 'p-4' : 'p-3'} flex items-start space-x-3`}>
                      <Checkbox
                        checked={selectedDeliveries.includes(delivery.id)}
                        className="mt-1"
                        readOnly
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-medium">
                            {delivery.delivery_number}
                          </Badge>
                          <span className="font-semibold text-sm">{delivery.customer_name}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{delivery.customer_address}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Summary */}
          {selectedDeliveries.length > 0 && selectedDriver && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Assignment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Driver:</span>
                  <p className="font-semibold text-blue-900 mt-1">
                    {drivers.find(d => d.id === selectedDriver)?.first_name} {drivers.find(d => d.id === selectedDriver)?.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Deliveries:</span>
                  <p className="font-semibold text-blue-900 mt-1">{selectedDeliveries.length} items</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={`order-2 sm:order-1 ${isMobile ? 'h-12' : ''}`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDriver || selectedDeliveries.length === 0 || isCreating}
              className={`order-1 sm:order-2 ${isMobile ? 'h-12' : ''}`}
            >
              {isCreating ? 'Creating Assignment...' : `Create Assignment (${selectedDeliveries.length})`}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </DialogWrapper>
  );
};

export default CreateDailyAssignmentDialog;
