
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useInventoryData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      console.log('useInventoryData: Fetching inventory...');
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('useInventoryData: Error fetching inventory:', error);
          throw error;
        }
        
        console.log('useInventoryData: Fetched inventory:', data);
        return (data || []) as InventoryItem[];
      } catch (error) {
        console.error('useInventoryData: Query error:', error);
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

  const stats = useMemo(() => {
    console.log('useInventoryData: Computing stats for inventory:', inventory?.length);
    
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
    
    console.log('useInventoryData: Computed stats:', result);
    return result;
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    console.log('useInventoryData: Filtering inventory, searchTerm:', searchTerm);
    
    if (!inventory) {
      console.log('useInventoryData: No inventory to filter');
      return [];
    }
    
    const filtered = inventory.filter(item =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('useInventoryData: Filtered inventory count:', filtered.length);
    return filtered;
  }, [inventory, searchTerm]);

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
  };

  return {
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
    isDeleting: deleteItemsMutation.isPending
  };
};
