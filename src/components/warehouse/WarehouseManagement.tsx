
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Package } from 'lucide-react';
import { useInventoryData } from '@/hooks/useInventoryData';
import InventoryTable from './InventoryTable';
import StockMovementHistory from './StockMovementHistory';
import WarehouseStats from './WarehouseStats';
import AddInventoryDialog from './AddInventoryDialog';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import { ResponsiveTabs, ResponsiveTabsList, ResponsiveTabsTrigger, ResponsiveTabsContent } from '@/components/ui/responsive-tabs';

const WarehouseManagement = () => {
  const { 
    inventory, 
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
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockMovementItem, setStockMovementItem] = useState(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3">
        <div className="text-red-600 text-sm sm:text-base">Error loading inventory: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Mobile-first header */}
      <ResponsiveHeader
        title="Inventory"
        subtitle="Manage your warehouse inventory and stock movements"
      >
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          {/* Search bar - prominent on mobile */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </ResponsiveHeader>

      {/* Stats Cards */}
      <WarehouseStats stats={stats} />

      {/* Main Content - Mobile optimized tabs */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Package className="h-5 w-5 mr-2" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ResponsiveTabs defaultValue="inventory" className="w-full">
            <div className="px-4 sm:px-0">
              <ResponsiveTabsList className="w-full">
                <ResponsiveTabsTrigger value="inventory" className="flex-1">
                  Current Inventory
                </ResponsiveTabsTrigger>
                <ResponsiveTabsTrigger value="movements" className="flex-1">
                  Stock Movements
                </ResponsiveTabsTrigger>
              </ResponsiveTabsList>
            </div>
            
            <ResponsiveTabsContent value="inventory" className="mt-4 sm:mt-6 px-0">
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
            
            <ResponsiveTabsContent value="movements" className="mt-4 sm:mt-6 px-0">
              <StockMovementHistory />
            </ResponsiveTabsContent>
          </ResponsiveTabs>
        </CardContent>
      </Card>

      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default WarehouseManagement;
