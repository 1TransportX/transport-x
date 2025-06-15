
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface WarehouseStatsProps {
  stats: {
    total: number;
    lowStock: number;
    totalValue: number;
    outOfStock: number;
  };
}

const WarehouseStats: React.FC<WarehouseStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-lg md:text-2xl font-bold">{stats.lowStock}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-lg md:text-2xl font-bold">{stats.outOfStock}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-lg md:text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseStats;
