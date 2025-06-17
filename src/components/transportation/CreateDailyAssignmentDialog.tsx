
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Package, Zap, Plus, Truck } from 'lucide-react';
import { useDailyRouteAssignments } from '@/hooks/useDailyRouteAssignments';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CreateRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  availableDeliveries: any[];
  drivers: any[];
}

const CreateRouteDialog: React.FC<CreateRouteDialogProps> = React.memo(({
  open,
  onOpenChange,
  selectedDate,
  availableDeliveries,
  drivers
}) => {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createAssignment, isCreating, getAssignedDeliveryIds } = useDailyRouteAssignments();
  
  // Assignment states - use refs to prevent re-renders
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  
  // New delivery states - use refs to prevent re-renders on every keystroke
  const deliveryFormRef = useRef({
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    delivery_number: '',
    notes: ''
  });

  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
  const [formKey, setFormKey] = useState(0); // Force re-render only when needed

  // Stable form change handler that doesn't cause re-renders
  const handleNewDeliveryChange = useCallback((field: string, value: string) => {
    deliveryFormRef.current = {
      ...deliveryFormRef.current,
      [field]: value
    };
  }, []);

  const handleCreateDelivery = useCallback(async () => {
    const formData = deliveryFormRef.current;
    
    if (!formData.customer_name || !formData.customer_address) {
      toast({
        title: "Error",
        description: "Customer name and address are required.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingDelivery(true);
    try {
      const deliveryNumber = formData.delivery_number || `DEL-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          delivery_number: deliveryNumber,
          customer_name: formData.customer_name,
          customer_address: formData.customer_address,
          customer_phone: formData.customer_phone || null,
          notes: formData.notes || null,
          scheduled_date: selectedDate,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Delivery Created",
        description: `Delivery route for ${formData.customer_name} has been created successfully.`,
      });

      // Reset form by updating ref and forcing re-render
      deliveryFormRef.current = {
        customer_name: '',
        customer_address: '',
        customer_phone: '',
        delivery_number: '',
        notes: ''
      };
      setFormKey(prev => prev + 1);

      // Use proper query invalidation
      await queryClient.invalidateQueries({ queryKey: ['deliveries-for-range'] });
      await queryClient.invalidateQueries({ queryKey: ['daily-route-assignments-range'] });
      
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast({
        title: "Error",
        description: "Failed to create delivery route.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingDelivery(false);
    }
  }, [selectedDate, toast, queryClient]);

  // Stable assignment handlers
  const handleDriverChange = useCallback((driverId: string) => {
    setSelectedDriver(driverId);
  }, []);

  const handleDeliveryToggle = useCallback((deliveryId: string) => {
    setSelectedDeliveries(current => 
      current.includes(deliveryId)
        ? current.filter(id => id !== deliveryId)
        : [...current, deliveryId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedDeliveries(current => 
      current.length === availableDeliveries.length
        ? []
        : availableDeliveries.map(d => d.id)
    );
  }, [availableDeliveries]);

  const smartAssignByLocation = useCallback(() => {
    if (availableDeliveries.length === 0 || drivers.length === 0) {
      return;
    }

    const assignedIds = getAssignedDeliveryIds();
    const unassignedDeliveries = availableDeliveries.filter(d => !assignedIds.has(d.id));
    
    if (unassignedDeliveries.length === 0) {
      setSelectedDeliveries([]);
      return;
    }

    const deliveriesPerDriver = Math.ceil(unassignedDeliveries.length / drivers.length);
    const driverIndex = drivers.findIndex(d => d.id === selectedDriver);
    const startIndex = driverIndex >= 0 ? driverIndex * deliveriesPerDriver : 0;
    const endIndex = Math.min(startIndex + deliveriesPerDriver, unassignedDeliveries.length);
    
    const assignedDeliveries = unassignedDeliveries.slice(startIndex, endIndex);
    setSelectedDeliveries(assignedDeliveries.map(d => d.id));
  }, [availableDeliveries, drivers, getAssignedDeliveryIds, selectedDriver]);

  const handleAssignDeliveries = useCallback(() => {
    if (!selectedDriver || selectedDeliveries.length === 0) {
      toast({
        title: "Error",
        description: "Please select a driver and at least one delivery.",
        variant: "destructive"
      });
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

    // Reset assignment form and close dialog
    setSelectedDriver('');
    setSelectedDeliveries([]);
    onOpenChange(false);
  }, [selectedDate, profile?.id, createAssignment, onOpenChange, toast, selectedDriver, selectedDeliveries]);

  // Memoize the selected driver info
  const selectedDriverInfo = useMemo(() => {
    return drivers.find(d => d.id === selectedDriver);
  }, [drivers, selectedDriver]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        setSelectedDriver('');
        setSelectedDeliveries([]);
        deliveryFormRef.current = {
          customer_name: '',
          customer_address: '',
          customer_phone: '',
          delivery_number: '',
          notes: ''
        };
        setFormKey(prev => prev + 1);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  // Memoize the entire dialog wrapper to prevent re-renders
  const DialogWrapper = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => {
      if (isMobile) {
        return (
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[95vh] flex flex-col">
              <SheetHeader className="flex-shrink-0 pb-4 border-b">
                <SheetTitle className="text-lg font-semibold">
                  Route Management for {new Date(selectedDate).toLocaleDateString()}
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-600">
                  Create new delivery routes or assign existing deliveries to drivers.
                </SheetDescription>
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
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                Route Management for {new Date(selectedDate).toLocaleDateString()}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Create new delivery routes or assign existing deliveries to drivers.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </DialogContent>
        </Dialog>
      );
    };
  }, [isMobile, open, onOpenChange, selectedDate]);

  return (
    <DialogWrapper>
      <Tabs defaultValue="create-delivery" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="create-delivery" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Route
          </TabsTrigger>
          <TabsTrigger value="assign-driver" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Assign to Driver
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="create-delivery" className="h-full">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      New Delivery Route
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4" key={formKey}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery_number">Delivery Number (Optional)</Label>
                        <Input
                          id="delivery_number"
                          placeholder="Auto-generated if empty"
                          defaultValue={deliveryFormRef.current.delivery_number}
                          onChange={(e) => handleNewDeliveryChange('delivery_number', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_name">Customer Name *</Label>
                        <Input
                          id="customer_name"
                          placeholder="Enter customer name"
                          defaultValue={deliveryFormRef.current.customer_name}
                          onChange={(e) => handleNewDeliveryChange('customer_name', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_address">Customer Address *</Label>
                      <Input
                        id="customer_address"
                        placeholder="Enter full delivery address"
                        defaultValue={deliveryFormRef.current.customer_address}
                        onChange={(e) => handleNewDeliveryChange('customer_address', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">Customer Phone</Label>
                      <Input
                        id="customer_phone"
                        placeholder="Enter customer phone number"
                        defaultValue={deliveryFormRef.current.customer_phone}
                        onChange={(e) => handleNewDeliveryChange('customer_phone', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special delivery instructions or notes"
                        defaultValue={deliveryFormRef.current.notes}
                        onChange={(e) => handleNewDeliveryChange('notes', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleCreateDelivery}
                      disabled={isCreatingDelivery}
                      className="w-full"
                    >
                      {isCreatingDelivery ? 'Creating Route...' : 'Create Delivery Route'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="assign-driver" className="h-full">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-1">
                {/* Driver Selection */}
                <div className="space-y-3">
                  <Label htmlFor="driver" className="text-base font-semibold">Select Driver</Label>
                  <Select value={selectedDriver} onValueChange={handleDriverChange}>
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
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Date:</span>
                        <p className="font-semibold text-blue-900 mt-1">
                          {new Date(selectedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Driver:</span>
                        <p className="font-semibold text-blue-900 mt-1">
                          {selectedDriverInfo?.first_name} {selectedDriverInfo?.last_name}
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
                    onClick={handleAssignDeliveries}
                    disabled={!selectedDriver || selectedDeliveries.length === 0 || isCreating}
                    className={`order-1 sm:order-2 ${isMobile ? 'h-12' : ''}`}
                  >
                    {isCreating ? 'Assigning...' : `Assign to Driver (${selectedDeliveries.length})`}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </DialogWrapper>
  );
});

CreateRouteDialog.displayName = 'CreateRouteDialog';

export default CreateRouteDialog;
