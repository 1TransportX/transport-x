
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportData {
  totalEmployees: number;
  activeVehicles: number;
  totalInventoryItems: number;
  totalInventoryValue: number;
  lowStockCount: number;
  generatedAt: string;
}

interface ReportDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ReportData | null;
}

const ReportDisplay = ({ open, onOpenChange, reportData }: ReportDisplayProps) => {
  if (!reportData) return null;

  const metrics = [
    {
      title: 'Total Employees',
      value: reportData.totalEmployees.toString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Active Vehicles',
      value: reportData.activeVehicles.toString(),
      icon: Truck,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Inventory Items',
      value: reportData.totalInventoryItems.toString(),
      icon: Package,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Inventory Value',
      value: `$${Math.round(reportData.totalInventoryValue).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Low Stock Items',
      value: reportData.lowStockCount.toString(),
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100'
    }
  ];

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Operational Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
              .metric-label { font-weight: bold; color: #666; }
              .metric-value { font-size: 24px; font-weight: bold; color: #333; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Operational Report</h1>
              <p>Generated on: ${new Date(reportData.generatedAt).toLocaleString()}</p>
            </div>
            
            <div class="section">
              <h2>Key Performance Indicators</h2>
              ${metrics.map(metric => `
                <div class="metric">
                  <div class="metric-label">${metric.title}</div>
                  <div class="metric-value">${metric.value}</div>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Operational Report</DialogTitle>
          <DialogDescription>
            Generated on {new Date(reportData.generatedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                    <div className={`p-2 rounded-full ${metric.color}`}>
                      <metric.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={printReport}>
              Print Report
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDisplay;
