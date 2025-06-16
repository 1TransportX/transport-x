
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Package, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTable } from '@/components/ui/mobile-table';

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

interface InventoryTableProps {
  inventory: InventoryItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedItems: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (itemId: string, checked: boolean) => void;
  onEditItem: (item: InventoryItem) => void;
  onStockMovement: (item: InventoryItem) => void;
  onDeleteSelected: () => void;
  showDeleteDialog: boolean;
  onShowDeleteDialog: (show: boolean) => void;
  isDeleting: boolean;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  searchTerm,
  onSearchChange,
  selectedItems,
  onSelectAll,
  onSelectItem,
  onEditItem,
  onStockMovement,
  onDeleteSelected,
  showDeleteDialog,
  onShowDeleteDialog,
  isDeleting
}) => {
  const isMobile = useIsMobile();

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.current_stock <= item.minimum_stock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const isAllSelected = inventory.length > 0 && selectedItems.size === inventory.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < inventory.length;

  const renderMobileCard = (item: InventoryItem) => {
    const stockStatus = getStockStatus(item);
    const isSelected = selectedItems.has(item.id);

    return (
      <div className={`space-y-3 ${isSelected ? 'bg-blue-50 rounded-lg p-2 -m-2' : ''}`}>
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectItem(item.id, checked as boolean)}
            />
            <div>
              <p className="font-medium text-sm">{item.product_name}</p>
              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
            </div>
          </div>
          <Badge className={stockStatus.color}>
            {stockStatus.status}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Category:</span>
            <p className="font-medium">{item.category || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <p className="font-medium">{item.warehouse_location || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Stock:</span>
            <p className="font-medium">{item.current_stock}</p>
          </div>
          <div>
            <span className="text-gray-500">Min Stock:</span>
            <p className="font-medium">{item.minimum_stock}</p>
          </div>
          <div>
            <span className="text-gray-500">Unit Price:</span>
            <p className="font-medium">${item.unit_price?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditItem(item)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStockMovement(item)}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-1" />
            Stock
          </Button>
        </div>
      </div>
    );
  };

  const renderDesktopTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              {...(isIndeterminate ? { 'data-state': 'indeterminate' } : {})}
            />
          </TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Current Stock</TableHead>
          <TableHead>Min Stock</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8 text-gray-500">
              No inventory items found. Add an item to get started.
            </TableCell>
          </TableRow>
        ) : (
          inventory.map((item) => {
            const stockStatus = getStockStatus(item);
            const isSelected = selectedItems.has(item.id);
            return (
              <TableRow key={item.id} className={isSelected ? 'bg-blue-50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectItem(item.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.sku}</TableCell>
                <TableCell>{item.product_name}</TableCell>
                <TableCell>{item.category || 'N/A'}</TableCell>
                <TableCell>{item.current_stock}</TableCell>
                <TableCell>{item.minimum_stock}</TableCell>
                <TableCell>${item.unit_price?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  <Badge className={stockStatus.color}>
                    {stockStatus.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.warehouse_location || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStockMovement(item)}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg sm:text-xl">Inventory ({inventory.length})</CardTitle>
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.size} selected
                </span>
                <AlertDialog open={showDeleteDialog} onOpenChange={onShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Items</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedItems.size} selected item(s)? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteSelected} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          
          {/* Hide search on mobile as it's in the header */}
          {!isMobile && (
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="max-w-sm"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <MobileTable
          data={inventory}
          renderMobileCard={renderMobileCard}
          renderDesktopTable={renderDesktopTable}
        />
      </CardContent>
    </Card>
  );
};

export default InventoryTable;
