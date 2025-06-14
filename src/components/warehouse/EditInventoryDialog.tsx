
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  sku: string;
  product_name: string;
  description: string | null;
  category: string | null;
  unit_price: number | null;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number | null;
  warehouse_location: string | null;
  barcode: string | null;
}

interface EditInventoryDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InventoryFormData {
  sku: string;
  product_name: string;
  description?: string;
  category?: string;
  unit_price?: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  warehouse_location?: string;
  barcode?: string;
}

const EditInventoryDialog: React.FC<EditInventoryDialogProps> = ({ item, open, onOpenChange }) => {
  const { register, handleSubmit, reset } = useForm<InventoryFormData>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (item) {
      reset({
        sku: item.sku,
        product_name: item.product_name,
        description: item.description || '',
        category: item.category || '',
        unit_price: item.unit_price || undefined,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        maximum_stock: item.maximum_stock || undefined,
        warehouse_location: item.warehouse_location || '',
        barcode: item.barcode || ''
      });
    }
  }, [item, reset]);

  const updateInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const { error } = await supabase
        .from('inventory')
        .update(data)
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({
        title: "Success",
        description: "Inventory item updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update inventory item.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: InventoryFormData) => {
    updateInventoryMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register('sku', { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                {...register('barcode')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              {...register('product_name', { required: true })}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register('category')}
              />
            </div>
            <div>
              <Label htmlFor="warehouse_location">Warehouse Location</Label>
              <Input
                id="warehouse_location"
                {...register('warehouse_location')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="current_stock">Current Stock</Label>
              <Input
                id="current_stock"
                type="number"
                {...register('current_stock', { required: true, valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="minimum_stock">Min Stock</Label>
              <Input
                id="minimum_stock"
                type="number"
                {...register('minimum_stock', { required: true, valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="maximum_stock">Max Stock</Label>
              <Input
                id="maximum_stock"
                type="number"
                {...register('maximum_stock', { valueAsNumber: true })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="unit_price">Unit Price</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              {...register('unit_price', { valueAsNumber: true })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateInventoryMutation.isPending}>
              {updateInventoryMutation.isPending ? 'Updating...' : 'Update Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryDialog;
