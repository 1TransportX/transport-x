
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface InventoryItem {
  id: string;
  sku: string;
  product_name: string;
  current_stock: number;
}

interface StockMovementDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StockMovementFormData {
  movement_type: 'inbound' | 'outbound' | 'damaged' | 'returned' | 'adjustment';
  quantity: number;
  reference_number?: string;
  batch_number?: string;
  expiry_date?: string;
  cost_per_unit?: number;
  supplier_customer?: string;
  notes?: string;
}

const StockMovementDialog: React.FC<StockMovementDialogProps> = ({ item, open, onOpenChange }) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<StockMovementFormData>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const movementType = watch('movement_type');
  const quantity = watch('quantity');

  const stockMovementMutation = useMutation({
    mutationFn: async (data: StockMovementFormData) => {
      // Calculate new stock level
      let newStock = item.current_stock;
      if (data.movement_type === 'inbound' || data.movement_type === 'returned') {
        newStock += data.quantity;
      } else {
        newStock -= data.quantity;
      }

      // Ensure stock doesn't go negative
      if (newStock < 0) {
        throw new Error('Insufficient stock for this operation');
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          inventory_id: item.id,
          movement_type: data.movement_type,
          quantity: data.quantity,
          reference_number: data.reference_number,
          batch_number: data.batch_number,
          expiry_date: data.expiry_date,
          cost_per_unit: data.cost_per_unit,
          total_cost: data.cost_per_unit ? data.cost_per_unit * data.quantity : null,
          supplier_customer: data.supplier_customer,
          performed_by: user?.id,
          notes: data.notes
        }]);

      if (movementError) throw movementError;

      // Update inventory stock level
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({ current_stock: newStock })
        .eq('id', item.id);

      if (inventoryError) throw inventoryError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({
        title: "Success",
        description: "Stock movement recorded successfully.",
      });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record stock movement.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: StockMovementFormData) => {
    stockMovementMutation.mutate(data);
  };

  const getNewStockLevel = () => {
    if (!quantity || !movementType) return item.current_stock;
    
    if (movementType === 'inbound' || movementType === 'returned') {
      return item.current_stock + quantity;
    } else {
      return item.current_stock - quantity;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Movement - {item.product_name}</DialogTitle>
          <p className="text-sm text-gray-600">Current Stock: {item.current_stock}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="movement_type">Movement Type</Label>
            <Select onValueChange={(value) => setValue('movement_type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select movement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">Inbound (Receiving)</SelectItem>
                <SelectItem value="outbound">Outbound (Shipping)</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              {...register('quantity', { required: true, valueAsNumber: true })}
              placeholder="0"
            />
            {quantity && movementType && (
              <p className="text-sm text-gray-600 mt-1">
                New stock level: {getNewStockLevel()}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                {...register('reference_number')}
                placeholder="REF001"
              />
            </div>
            <div>
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input
                id="batch_number"
                {...register('batch_number')}
                placeholder="BATCH001"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost_per_unit">Cost per Unit</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                {...register('cost_per_unit', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                {...register('expiry_date')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="supplier_customer">Supplier/Customer</Label>
            <Input
              id="supplier_customer"
              {...register('supplier_customer')}
              placeholder="Supplier or Customer name"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={stockMovementMutation.isPending}>
              {stockMovementMutation.isPending ? 'Recording...' : 'Record Movement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockMovementDialog;
