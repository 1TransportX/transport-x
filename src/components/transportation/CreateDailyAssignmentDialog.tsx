
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
import { MapPin, Users, Package } from 'lucide-react';
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

  const DialogContent_Component = ({ children }: { children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader className="pb-4">
              <SheetTitle>Create Daily Route Assignment</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full pr-4">
              {children}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create Daily Route Assignment</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[60vh] pr-4">
            {children}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <DialogContent_Component>
      <div className="space-y-6 pb-6">
        {/* Driver Selection */}
        <div className="space-y-3">
          <Label htmlFor="driver" className="text-base font-medium">Select Driver</Label>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="h-12">
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <Label className="text-base font-medium">
              Select Deliveries ({selectedDeliveries.length} selected)
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoAssignByLocation}
                disabled={availableDeliveries.length === 0}
                className="flex-1 sm:flex-none"
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
                className="flex-1 sm:flex-none"
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
            <div className="border rounded-lg">
              {availableDeliveries.map((delivery, index) => (
                <div
                  key={delivery.id}
                  className={`flex items-start space-x-3 p-4 hover:bg-gray-50 ${
                    index !== availableDeliveries.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedDeliveries.includes(delivery.id)}
                    onCheckedChange={() => handleDeliveryToggle(delivery.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {delivery.delivery_number}
                      </Badge>
                      <span className="font-medium text-sm">{delivery.customer_name}</span>
                    </div>
                    <p className="text-sm text-gray-600 break-words">
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
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-900">Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Driver:</span>
                  <p className="font-medium text-blue-900">
                    {selectedDriver ? drivers.find(d => d.id === selectedDriver)?.first_name + ' ' + drivers.find(d => d.id === selectedDriver)?.last_name : 'Not selected'}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Deliveries:</span>
                  <p className="font-medium text-blue-900">{selectedDeliveries.length} items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDriver || selectedDeliveries.length === 0 || isCreating}
            className="order-1 sm:order-2"
          >
            {isCreating ? 'Creating...' : 'Create Assignment'}
          </Button>
        </div>
      </div>
    </DialogContent_Component>
  );
};

export default CreateDailyAssignmentDialog;
