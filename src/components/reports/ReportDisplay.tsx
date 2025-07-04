
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Truck, Package, DollarSign, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportData {
  totalEmployees: number;
  activeVehicles: number;
  totalInventoryItems: number;
  totalInventoryValue: number;
  lowStockCount: number;
  generatedAt: string;
  generatedBy?: string;
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
              body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                color: #333;
                line-height: 1.6;
              }
              .header { 
                border-bottom: 2px solid #ccc; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
                text-align: center;
              }
              .header h1 {
                color: #1f2937;
                margin-bottom: 10px;
              }
              .section { 
                margin-bottom: 30px; 
              }
              .section h2 {
                color: #374151;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 10px;
              }
              .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
              }
              .metric { 
                padding: 20px; 
                border: 1px solid #e5e7eb; 
                border-radius: 8px;
                background-color: #f9fafb;
                text-align: center;
              }
              .metric-label { 
                font-weight: bold; 
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 5px;
              }
              .metric-value { 
                font-size: 28px; 
                font-weight: bold; 
                color: #1f2937;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
              }
              @media print { 
                body { margin: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Operational Report</h1>
              <p><strong>Generated on:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</p>
              ${reportData.generatedBy ? `<p><strong>Generated by:</strong> ${reportData.generatedBy}</p>` : ''}
            </div>
            
            <div class="section">
              <h2>Key Performance Indicators</h2>
              <div class="metrics-grid">
                ${metrics.map(metric => `
                  <div class="metric">
                    <div class="metric-label">${metric.title}</div>
                    <div class="metric-value">${metric.value}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="footer">
              <p>This report was generated by ETW Manager System</p>
              <p>Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
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
            {reportData.generatedBy && ` by ${reportData.generatedBy}`}
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
            <Button variant="outline" onClick={printReport} className="flex items-center space-x-2">
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
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
