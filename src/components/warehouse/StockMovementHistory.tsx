
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, RotateCcw, AlertTriangle, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface StockMovement {
  id: string;
  movement_type: 'inbound' | 'outbound' | 'damaged' | 'returned' | 'adjustment';
  quantity: number;
  reference_number: string | null;
  batch_number: string | null;
  supplier_customer: string | null;
  notes: string | null;
  created_at: string;
  performed_by: string | null;
  inventory: {
    product_name: string;
    sku: string;
  };
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface StockMovementHistoryProps {
  inventoryId?: string;
  showItemDetails?: boolean;
}

const StockMovementHistory: React.FC<StockMovementHistoryProps> = ({ 
  inventoryId, 
  showItemDetails = true 
}) => {
  console.log('StockMovementHistory: Rendering for inventoryId:', inventoryId);

  const { data: movements = [], isLoading, error } = useQuery({
    queryKey: ['stock-movements', inventoryId],
    queryFn: async () => {
      console.log('StockMovementHistory: Fetching movements...');
      
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          inventory (
            product_name,
            sku
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (inventoryId) {
        query = query.eq('inventory_id', inventoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('StockMovementHistory: Error fetching movements:', error);
        throw error;
      }
      
      console.log('StockMovementHistory: Fetched movements:', data);
      return data as StockMovement[];
    }
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'inbound':
      case 'returned':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'outbound':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'damaged':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'adjustment':
        return <Settings className="h-4 w-4 text-blue-600" />;
      default:
        return <RotateCcw className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const variants = {
      inbound: 'bg-green-100 text-green-800',
      outbound: 'bg-red-100 text-red-800',
      damaged: 'bg-yellow-100 text-yellow-800',
      returned: 'bg-blue-100 text-blue-800',
      adjustment: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (error) {
    console.error('StockMovementHistory: Rendering error state:', error);
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            Error loading movement history: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    console.log('StockMovementHistory: Rendering loading state');
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('StockMovementHistory: Rendering main content with', movements.length, 'movements');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Stock Movement History {inventoryId ? '' : `(${movements.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {showItemDetails && <TableHead>Item</TableHead>}
              <TableHead>Movement</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showItemDetails ? 7 : 6} className="text-center py-8 text-gray-500">
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  {showItemDetails && (
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.inventory.product_name}</div>
                        <div className="text-sm text-gray-500">{movement.inventory.sku}</div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.movement_type)}
                      {getMovementBadge(movement.movement_type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={
                      movement.movement_type === 'inbound' || movement.movement_type === 'returned'
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }>
                      {movement.movement_type === 'inbound' || movement.movement_type === 'returned' ? '+' : '-'}
                      {movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {movement.reference_number && (
                        <div>Ref: {movement.reference_number}</div>
                      )}
                      {movement.batch_number && (
                        <div>Batch: {movement.batch_number}</div>
                      )}
                      {movement.supplier_customer && (
                        <div className="text-gray-600">{movement.supplier_customer}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {movement.profiles 
                      ? `${movement.profiles.first_name || ''} ${movement.profiles.last_name || ''}`.trim() || 'Unknown'
                      : 'System'
                    }
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={movement.notes || ''}>
                      {movement.notes || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StockMovementHistory;
