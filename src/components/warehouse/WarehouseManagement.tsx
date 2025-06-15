import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTabs, ResponsiveTabsList, ResponsiveTabsTrigger, ResponsiveTabsContent } from '@/components/ui/responsive-tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Package, AlertTriangle, TrendingUp, TrendingDown, History, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AddInventoryDialog from './AddInventoryDialog';
import EditInventoryDialog from './EditInventoryDialog';
import StockMovementDialog from './StockMovementDialog';
import StockMovementHistory from './StockMovementHistory';

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

const WarehouseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [stockMovementItem, setStockMovementItem] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  console.log('WarehouseManagement: Component rendering');

  const { data: inventory = [], isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      console.log('WarehouseManagement: Fetching inventory...');
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('WarehouseManagement: Error fetching inventory:', error);
          throw error;
        }
        
        console.log('WarehouseManagement: Fetched inventory:', data);
        return (data || []) as InventoryItem[];
      } catch (error) {
        console.error('WarehouseManagement: Query error:', error);
        throw error;
      }
    }
  });

  const deleteItemsMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .in('id', itemIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItems(new Set());
      toast({
        title: "Success",
        description: "Selected items have been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting items:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected items. Please try again.",
        variant: "destructive",
      });
    }
  });

  console.log('WarehouseManagement: isLoading:', isLoading, 'inventory:', inventory?.length, 'error:', error);

  const stats = useMemo(() => {
    console.log('WarehouseManagement: Computing stats for inventory:', inventory?.length);
    
    if (!inventory || inventory.length === 0) {
      return {
        total: 0,
        lowStock: 0,
        totalValue: 0,
        outOfStock: 0
      };
    }

    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.current_stock <= item.minimum_stock).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * (item.unit_price || 0)), 0);
    const outOfStock = inventory.filter(item => item.current_stock === 0).length;

    const result = {
      total: totalItems,
      lowStock: lowStockItems,
      totalValue,
      outOfStock
    };
    
    console.log('WarehouseManagement: Computed stats:', result);
    return result;
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    console.log('WarehouseManagement: Filtering inventory, searchTerm:', searchTerm);
    
    if (!inventory) {
      console.log('WarehouseManagement: No inventory to filter');
      return [];
    }
    
    const filtered = inventory.filter(item =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('WarehouseManagement: Filtered inventory count:', filtered.length);
    return filtered;
  }, [inventory, searchTerm]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.current_stock <= item.minimum_stock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredInventory.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    deleteItemsMutation.mutate(Array.from(selectedItems));
    setShowDeleteDialog(false);
  };

  const isAllSelected = filteredInventory.length > 0 && selectedItems.size === filteredInventory.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < filteredInventory.length;

  if (error) {
    console.error('WarehouseManagement: Rendering error state:', error);
    return (
      <div className="p-6">
        <div className="text-red-600">
          Error loading warehouse data: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log('WarehouseManagement: Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('WarehouseManagement: Rendering main content');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-gray-600 mt-2">Track inventory, manage stock levels, and monitor shipments.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ResponsiveTabs defaultValue="inventory" className="w-full">
        <ResponsiveTabsList className={isMobile ? "grid grid-cols-2 gap-1 h-auto p-1" : "inline-flex"}>
          <ResponsiveTabsTrigger value="inventory" className={isMobile ? "flex flex-col items-center gap-1 p-3 h-auto" : "flex items-center gap-2"}>
            <Package className="h-4 w-4" />
            <span className={isMobile ? "text-xs" : ""}>Inventory</span>
          </ResponsiveTabsTrigger>
          <ResponsiveTabsTrigger value="movements" className={isMobile ? "flex flex-col items-center gap-1 p-3 h-auto" : "flex items-center gap-2"}>
            <History className="h-4 w-4" />
            <span className={isMobile ? "text-xs" : ""}>
              {isMobile ? "History" : "Movement History"}
            </span>
          </ResponsiveTabsTrigger>
        </ResponsiveTabsList>

        <ResponsiveTabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <CardTitle>Inventory ({filteredInventory.length})</CardTitle>
                  {selectedItems.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {selectedItems.size} selected
                      </span>
                      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Selected
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
                            <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
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
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        No inventory items found. Add an item to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => {
                      const stockStatus = getStockStatus(item);
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <TableRow key={item.id} className={isSelected ? 'bg-blue-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
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
                                onClick={() => setEditingItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStockMovementItem(item)}
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
            </CardContent>
          </Card>
        </ResponsiveTabsContent>

        <ResponsiveTabsContent value="movements">
          <StockMovementHistory />
        </ResponsiveTabsContent>
      </ResponsiveTabs>

      <AddInventoryDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
      
      {editingItem && (
        <EditInventoryDialog 
          item={editingItem}
          open={!!editingItem}
          onOpenChange={() => setEditingItem(null)}
        />
      )}

      {stockMovementItem && (
        <StockMovementDialog 
          item={stockMovementItem}
          open={!!stockMovementItem}
          onOpenChange={() => setStockMovementItem(null)}
        />
      )}
    </div>
  );
};

export default WarehouseManagement;
