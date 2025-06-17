
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSecurity } from '@/contexts/SecurityContext';
import { RateLimiter, sanitizeError } from '@/utils/security';
import SecureLocationSearchInput from '@/components/transportation/SecureLocationSearchInput';
import SecureInput from '@/components/forms/SecureInput';
import { IndianPhoneInput } from '@/components/forms/IndianPhoneInput';

interface AddDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driverId?: string;
}

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
}

// Rate limiter for form submissions
const formRateLimiter = new RateLimiter(5, 300000); // 5 submissions per 5 minutes

const AddDeliveryDialog: React.FC<AddDeliveryDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  driverId
}) => {
  const { toast } = useToast();
  const { logSecurityEvent } = useSecurity();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
      logSecurityEvent('delivery_dialog_opened', 'info');
    }
  }, [isOpen, logSecurityEvent]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, make, model')
        .eq('status', 'active')
        .order('vehicle_number');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      logSecurityEvent('vehicle_fetch_error', 'error', { error: sanitizeError(error) });
    }
  };

  const generateDeliveryNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `DEL-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const rateLimitKey = `delivery_form_${driverId || 'anonymous'}`;
    if (!formRateLimiter.isAllowed(rateLimitKey)) {
      const remaining = formRateLimiter.getRemainingAttempts(rateLimitKey);
      logSecurityEvent('delivery_form_rate_limited', 'warning', { remaining });
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many form submissions. Please wait before trying again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create delivery
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          delivery_number: generateDeliveryNumber(),
          customer_name: formData.customer_name,
          customer_address: formData.customer_address,
          customer_phone: formData.customer_phone,
          scheduled_date: formData.scheduled_date,
          vehicle_id: formData.vehicle_id,
          driver_id: driverId,
          notes: formData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      logSecurityEvent('delivery_created', 'info', { 
        deliveryId: delivery.id
      });

      toast({
        title: "Success",
        description: "Delivery route added successfully",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating delivery:', error);
      logSecurityEvent('delivery_creation_error', 'error', { error: sanitizeError(error) });
      toast({
        title: "Error",
        description: sanitizeError(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_address: '',
      customer_phone: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      vehicle_id: '',
      notes: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Delivery Route</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecureInput
              value={formData.customer_name}
              onChange={(value) => setFormData(prev => ({ ...prev, customer_name: value }))}
              label="Customer Name"
              required
              maxLength={100}
              id="customer_name"
            />

            <IndianPhoneInput
              value={formData.customer_phone}
              onChange={(value) => setFormData(prev => ({ ...prev, customer_phone: value }))}
              label="Customer Phone"
              required
            />
          </div>

          <div>
            <SecureLocationSearchInput
              value={formData.customer_address}
              onChange={(address) => setFormData(prev => ({ ...prev, customer_address: address }))}
              placeholder="Start typing an address..."
              label="Customer Address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_date">Scheduled Date</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="vehicle_id">Vehicle</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special delivery instructions..."
              maxLength={500}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Delivery'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeliveryDialog;
