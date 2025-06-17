
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

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

const EditInventoryDialog: React.FC<EditInventoryDialogProps> = ({ item, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inventory System Removed</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              The inventory management system has been removed from this application.
              This is now a transportation and delivery management system only.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryDialog;
