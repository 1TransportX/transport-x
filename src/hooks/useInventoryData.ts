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
  console.warn('useInventoryData hook is deprecated - inventory functionality has been removed');
  
  return {
    inventory: [],
    filteredInventory: [],
    isLoading: false,
    error: null,
    stats: {
      total: 0,
      lowStock: 0,
      totalValue: 0,
      outOfStock: 0
    },
    searchTerm: '',
    setSearchTerm: () => {},
    selectedItems: new Set(),
    handleSelectAll: () => {},
    handleSelectItem: () => {},
    handleDeleteSelected: () => {},
    isDeleting: false
  };
};
