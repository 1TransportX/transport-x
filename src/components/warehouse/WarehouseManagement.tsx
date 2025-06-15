
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveTabs, ResponsiveTabsList, ResponsiveTabsTrigger, ResponsiveTabsContent } from '@/components/ui/responsive-tabs';
import { Plus, Package, History } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInventoryData } from '@/hooks/useInventoryData';
import AddInventoryDialog from './AddInventoryDialog';
import EditInventoryDialog from './EditInventoryDialog';
import StockMovementDialog from './StockMovementDialog';
import StockMovementHistory from './StockMovementHistory';
import WarehouseStats from './WarehouseStats';
import InventoryTable from './InventoryTable';

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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [stockMovementItem, setStockMovementItem] = useState<InventoryItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isMobile = useIsMobile();

  const {
    filteredInventory,
    isLoading,
    error,
    stats,
    searchTerm,
    setSearchTerm,
    selectedItems,
    handleSelectAll,
    handleSelectItem,
    handleDeleteSelected,
    isDeleting
  } = useInventoryData();

  console.log('WarehouseManagement: Component rendering');

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

      <WarehouseStats stats={stats} />

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
          <InventoryTable
            inventory={filteredInventory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedItems={selectedItems}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
            onEditItem={setEditingItem}
            onStockMovement={setStockMovementItem}
            onDeleteSelected={handleDeleteSelected}
            showDeleteDialog={showDeleteDialog}
            onShowDeleteDialog={setShowDeleteDialog}
            isDeleting={isDeleting}
          />
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
