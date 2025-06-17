
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockMovementHistoryProps {
  inventoryId?: string;
  showItemDetails?: boolean;
}

const StockMovementHistory: React.FC<StockMovementHistoryProps> = ({ 
  inventoryId, 
  showItemDetails = true 
}) => {
  console.log('StockMovementHistory: Component deprecated - inventory system removed');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Movement History - System Removed</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center">
        <p className="text-gray-500">
          The inventory management system has been removed from this application.
          This is now a transportation and delivery management system only.
        </p>
      </CardContent>
    </Card>
  );
};

export default StockMovementHistory;
