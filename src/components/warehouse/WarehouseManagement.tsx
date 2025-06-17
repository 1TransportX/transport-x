
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { ResponsiveHeader } from '@/components/ui/responsive-header';

const WarehouseManagement = () => {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <ResponsiveHeader
        title="Warehouse"
        subtitle="Warehouse functionality has been removed from this system"
      />

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Package className="h-5 w-5 mr-2" />
            Warehouse Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Warehouse Feature Removed
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              The warehouse management functionality has been removed from this system. 
              This system now focuses on admin and driver operations only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseManagement;
