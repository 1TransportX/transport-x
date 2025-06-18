
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Users } from 'lucide-react';
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
  selectedDate: initialDate,
  availableDeliveries,
  drivers
}) => {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createAssignment, isCreating } = useDailyRouteAssignments();
  
  // Form states
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [availableDrivers, setAvailableDrivers] = useState(drivers);
  
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

  // Update selected date when prop changes
  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  // Filter drivers based on selected date and leave requests
  useEffect(() => {
    const filterDriversByLeave = async () => {
      if (!selectedDate) {
        setAvailableDrivers(drivers);
        return;
      }

      try {
        // Fetch approved leave requests that overlap with the selected date
        const { data: leaveRequests, error } = await supabase
          .from('leave_requests')
          .select('user_id')
          .eq('status', 'approved')
          .lte('start_date', selectedDate)
          .gte('end_date', selectedDate);

        if (error) {
          console.error('Error fetching leave requests:', error);
          setAvailableDrivers(drivers);
          return;
        }

        // Get user IDs that are on leave
        const driversOnLeave = new Set(leaveRequests?.map(leave => leave.user_id) || []);

        // Filter out drivers who are on leave
        const filtered = drivers.filter(driver => !driversOnLeave.has(driver.id));
        setAvailableDrivers(filtered);

        // Clear selected driver if they're no longer available
        if (selectedDriver && driversOnLeave.has(selectedDriver)) {
          setSelectedDriver('');
          toast({
            title: "Driver Unavailable",
            description: "The selected driver is on approved leave for this date and has been deselected.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error filtering drivers by leave:', error);
        setAvailableDrivers(drivers);
      }
    };

    filterDriversByLeave();
  }, [selectedDate, drivers, selectedDriver, toast]);

  // Generate 6-digit delivery number
  const generateDeliveryNumber = useCallback(() => {
    const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit number between 100000-999999
    return `DEL-${randomNum}`;
  }, []);

  // Format phone number with space after 5 digits
  const formatPhoneNumber = useCallback((value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    
    // Add space after 5 digits if more than 5 digits
    if (limitedDigits.length > 5) {
      return `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`;
    }
    
    return limitedDigits;
  }, []);

  // Stable form change handler that doesn't cause re-renders
  const handleNewDeliveryChange = useCallback((field: string, value: string) => {
    if (field === 'customer_phone') {
      value = formatPhoneNumber(value);
    }
    
    deliveryFormRef.current = {
      ...deliveryFormRef.current,
      [field]: value
    };
  }, [formatPhoneNumber]);

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

    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a delivery date.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingDelivery(true);
    try {
      const deliveryNumber = formData.delivery_number || generateDeliveryNumber();
      
      // Clean phone number for database storage (remove spaces)
      const cleanedPhone = formData.customer_phone.replace(/\s/g, '');
      
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          delivery_number: deliveryNumber,
          customer_name: formData.customer_name,
          customer_address: formData.customer_address,
          customer_phone: cleanedPhone || null,
          notes: formData.notes || null,
          scheduled_date: selectedDate,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // If a driver is selected, create assignment immediately
      if (selectedDriver) {
        await createAssignment({
          assignment_date: selectedDate,
          driver_id: selectedDriver,
          delivery_ids: [delivery.id],
          optimized_order: [],
          total_distance: 0,
          estimated_duration: 0,
          status: 'planned',
          created_by: profile?.id || ''
        });

        toast({
          title: "Route Created & Assigned",
          description: `Delivery route for ${formData.customer_name} has been created and assigned successfully.`,
        });
      } else {
        toast({
          title: "Delivery Created",
          description: `Delivery route for ${formData.customer_name} has been created successfully.`,
        });
      }

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
      
      // Close dialog
      onOpenChange(false);
      
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
  }, [selectedDate, selectedDriver, toast, queryClient, createAssignment, profile?.id, onOpenChange, generateDeliveryNumber]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        setSelectedDriver('');
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

  // Memoize the selected driver info
  const selectedDriverInfo = useMemo(() => {
    return availableDrivers.find(d => d.id === selectedDriver);
  }, [availableDrivers, selectedDriver]);

  // Memoize the entire dialog wrapper to prevent re-renders
  const DialogWrapper = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => {
      if (isMobile) {
        return (
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[95vh] flex flex-col">
              <SheetHeader className="flex-shrink-0 pb-4 border-b">
                <SheetTitle className="text-lg font-semibold">
                  Create New Delivery Route
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-600">
                  Create a new delivery route and optionally assign it to a driver.
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
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                Create New Delivery Route
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Create a new delivery route and optionally assign it to a driver.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </DialogContent>
        </Dialog>
      );
    };
  }, [isMobile, open, onOpenChange]);

  return (
    <DialogWrapper>
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
              {/* Date and Driver Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Assign to Driver (Optional)</Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-3 w-3 text-blue-600" />
                            </div>
                            <span>{driver.first_name} {driver.last_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableDrivers.length < drivers.length && selectedDate && (
                    <p className="text-sm text-amber-600">
                      Some drivers are unavailable due to approved leave requests for this date.
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Details */}
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
                <Label htmlFor="customer_phone">Customer Phone (Max 10 digits)</Label>
                <Input
                  id="customer_phone"
                  placeholder="12345 67890"
                  defaultValue={deliveryFormRef.current.customer_phone}
                  onChange={(e) => handleNewDeliveryChange('customer_phone', e.target.value)}
                  maxLength={11} // 10 digits + 1 space
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

              {/* Assignment Summary */}
              {selectedDriver && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <span className="text-blue-700 font-medium">Will be assigned to:</span>
                      <p className="font-semibold text-blue-900 mt-1">
                        {selectedDriverInfo?.first_name} {selectedDriverInfo?.last_name}
                      </p>
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
                  className={`order-2 sm:order-1 ${isMobile ? 'h-12' : ''}`}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDelivery}
                  disabled={isCreatingDelivery || isCreating}
                  className={`order-1 sm:order-2 ${isMobile ? 'h-12' : ''}`}
                >
                  {isCreatingDelivery || isCreating ? 'Creating...' : 
                   selectedDriver ? 'Create & Assign Route' : 'Create Route'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </DialogWrapper>
  );
});

CreateRouteDialog.displayName = 'CreateRouteDialog';

export default CreateRouteDialog;
