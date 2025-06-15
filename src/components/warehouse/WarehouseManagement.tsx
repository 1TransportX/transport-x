
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Package } from 'lucide-react';
import { useInventoryData } from '@/hooks/useInventoryData';
import InventoryTable from './InventoryTable';
import StockMovementHistory from './StockMovementHistory';
import WarehouseStats from './WarehouseStats';
import AddInventoryDialog from './AddInventoryDialog';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error loading inventory: {error.message}</div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'p-3 space-y-4' : 'p-6 space-y-6'}`}>
      {/* Header - Updated for mobile stacking */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row justify-between items-center'}`}>
        <div className={isMobile ? 'text-center' : ''}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
            Inventory
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
            Manage your warehouse inventory and stock movements
          </p>
        </div>
        {/* Search bar moved to separate line on mobile */}
        {isMobile && (
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
        <div className={`flex ${isMobile ? 'flex-col space-y-2 w-full' : 'flex-row items-center space-x-4'}`}>
          {!isMobile && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          )}
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className={`${isMobile ? 'w-full' : ''} bg-blue-600 hover:bg-blue-700`}
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? 'Add Item' : 'Add Inventory Item'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <WarehouseStats stats={stats} />

      {/* Main Content */}
      <Card>
        <CardHeader className={isMobile ? 'p-4 pb-2' : 'p-6'}>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className={`${isMobile ? 'w-full' : 'grid w-full'} grid-cols-2`}>
              <TabsTrigger value="inventory" className={isMobile ? 'text-xs' : ''}>
                Current Inventory
              </TabsTrigger>
              <TabsTrigger value="movements" className={isMobile ? 'text-xs' : ''}>
                Stock Movements
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="inventory" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
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
            </TabsContent>
            
            <TabsContent value="movements" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
              <StockMovementHistory />
            </TabsContent>
          </Tabs>
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
