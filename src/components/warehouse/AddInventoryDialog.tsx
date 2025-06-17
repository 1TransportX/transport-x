
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({ open, onOpenChange }) => {
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

export default AddInventoryDialog;
