
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AddInventoryDialogProps {
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

const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset } = useForm<InventoryFormData>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const { error } = await supabase
        .from('inventory')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({
        title: "Success",
        description: "Inventory item added successfully.",
      });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add inventory item.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: InventoryFormData) => {
    addInventoryMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register('sku', { required: true })}
                placeholder="SKU001"
              />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="123456789"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              {...register('product_name', { required: true })}
              placeholder="Product Name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Product description..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="Electronics"
              />
            </div>
            <div>
              <Label htmlFor="warehouse_location">Warehouse Location</Label>
              <Input
                id="warehouse_location"
                {...register('warehouse_location')}
                placeholder="A1-B2"
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
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="minimum_stock">Min Stock</Label>
              <Input
                id="minimum_stock"
                type="number"
                {...register('minimum_stock', { required: true, valueAsNumber: true })}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="maximum_stock">Max Stock</Label>
              <Input
                id="maximum_stock"
                type="number"
                {...register('maximum_stock', { valueAsNumber: true })}
                placeholder="1000"
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
              placeholder="29.99"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addInventoryMutation.isPending}>
              {addInventoryMutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryDialog;
