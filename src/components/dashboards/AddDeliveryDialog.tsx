import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface InventoryItem {
  id: string;
  product_name: string;
  current_stock: number;
}

const AddDeliveryDialog: React.FC<AddDeliveryDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  driverId
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    notes: '',
    items: [{ inventory_id: '', quantity: 1 }]
  });

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
      fetchInventory();
    }
  }, [isOpen]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, make, model')
        .eq('status', 'active')
        .order('vehicle_number');

      if (error) throw error;
      console.log('Fetched vehicles:', data);
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      console.log('Starting to fetch inventory...');
      console.log('Supabase client:', supabase);
      
      // First, let's test if we can connect to Supabase at all
      const { data: testData, error: testError } = await supabase
        .from('inventory')
        .select('count(*)', { count: 'exact' });
      
      console.log('Test connection - count result:', testData, 'error:', testError);
      
      // Now try to fetch all inventory without any filters
      const { data: allInventory, error: allError } = await supabase
        .from('inventory')
        .select('*');
        
      console.log('All inventory data (no filters):', allInventory);
      console.log('All inventory error:', allError);
      
      // Now try with our specific query
      const { data, error } = await supabase
        .from('inventory')
        .select('id, product_name, current_stock')
        .gt('current_stock', 0)
        .order('product_name');

      if (error) {
        console.error('Supabase error fetching inventory:', error);
        throw error;
      }
      
      console.log('Filtered inventory data (stock > 0):', data);
      console.log('Number of inventory items with stock > 0:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('No inventory items found with stock > 0');
        
        // If no items with stock > 0, let's show all items but indicate they're out of stock
        const { data: allData, error: allError } = await supabase
          .from('inventory')
          .select('id, product_name, current_stock')
          .order('product_name');
          
        console.log('All inventory items (including zero stock):', allData);
        if (allError) console.error('Error fetching all inventory:', allError);
        
        if (allData && allData.length > 0) {
          // Show all items even if out of stock, but user will see the stock levels
          setInventory(allData);
          toast({
            title: "Warning",
            description: "Some products may be out of stock. Check stock levels before adding to delivery.",
            variant: "destructive"
          });
        } else {
          setInventory([]);
          toast({
            title: "No Products",
            description: "No products found in inventory. Please add products in the warehouse management section first.",
            variant: "destructive"
          });
        }
      } else {
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error", 
        description: "Failed to load inventory items. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const generateDeliveryNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `DEL-${timestamp}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setFormData(prev => ({ ...prev, customer_phone: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate that at least one item is selected
      const validItems = formData.items.filter(item => item.inventory_id && item.quantity > 0);
      
      if (validItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one item to the delivery",
          variant: "destructive"
        });
        return;
      }

      // Check if selected items have sufficient stock
      for (const item of validItems) {
        const inventoryItem = inventory.find(inv => inv.id === item.inventory_id);
        if (inventoryItem && inventoryItem.current_stock < item.quantity) {
          toast({
            title: "Error",
            description: `Insufficient stock for ${inventoryItem.product_name}. Available: ${inventoryItem.current_stock}, Requested: ${item.quantity}`,
            variant: "destructive"
          });
          return;
        }
      }

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

      // Create delivery items and update inventory stock
      if (validItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('delivery_items')
          .insert(
            validItems.map(item => ({
              delivery_id: delivery.id,
              inventory_id: item.inventory_id,
              quantity: item.quantity
            }))
          );

        if (itemsError) throw itemsError;

        // Update inventory stock for each item
        for (const item of validItems) {
          const inventoryItem = inventory.find(inv => inv.id === item.inventory_id);
          if (inventoryItem) {
            const newStock = inventoryItem.current_stock - item.quantity;
            
            const { error: stockError } = await supabase
              .from('inventory')
              .update({ current_stock: newStock })
              .eq('id', item.inventory_id);

            if (stockError) {
              console.error('Error updating stock for item:', item.inventory_id, stockError);
              throw stockError;
            }

            console.log(`Updated stock for ${inventoryItem.product_name}: ${inventoryItem.current_stock} -> ${newStock}`);
          }
        }
      }

      toast({
        title: "Success",
        description: "Delivery route added successfully and warehouse quantities updated",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast({
        title: "Error",
        description: "Failed to create delivery route",
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
      notes: '',
      items: [{ inventory_id: '', quantity: 1 }]
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { inventory_id: '', quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  console.log('Current inventory state in dialog:', inventory);
  console.log('Inventory loading state:', loading);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Delivery Route</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="customer_phone">Customer Phone (10 digits)</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={handlePhoneChange}
                placeholder="1234567890"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customer_address">Customer Address</Label>
            <Textarea
              id="customer_address"
              value={formData.customer_address}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
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
            <Label>Delivery Items</Label>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Product</Label>
                    <Select
                      value={item.inventory_id}
                      onValueChange={(value) => {
                        console.log('Selected product ID:', value);
                        updateItem(index, 'inventory_id', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No products found in inventory. Please add products in warehouse first.
                          </div>
                        ) : (
                          inventory.map((product) => (
                            <SelectItem 
                              key={product.id} 
                              value={product.id}
                              disabled={product.current_stock === 0}
                            >
                              {product.product_name} (Stock: {product.current_stock})
                              {product.current_stock === 0 && " - Out of Stock"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="mt-2"
              >
                Add Item
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special delivery instructions..."
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
