import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import AddEmployeeDialog from '@/components/employees/AddEmployeeDialog';
import ReportDisplay from '@/components/reports/ReportDisplay';

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showReportDisplay, setShowReportDisplay] = useState(false);
  const [currentReportData, setCurrentReportData] = useState(null);

  // Fetch employees with their roles
  const { data: employees = [] } = useQuery({
    queryKey: ['dashboard-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Map the data to include role information
      return data.map(profile => ({
        ...profile,
        role: profile.user_roles?.[0]?.role || 'employee'
      }));
    }
  });

  // Fetch real data from database
  const { data: vehicles = [] } = useQuery({
    queryKey: ['dashboard-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: stockMovements = [] } = useQuery({
    queryKey: ['dashboard-stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate real KPI data
  const totalEmployees = employees.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalInventoryItems = inventory.length;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.current_stock * (item.unit_price || 0)), 0);

  // Generate real alerts based on data
  const lowStockItems = inventory.filter(item => item.current_stock <= item.minimum_stock);
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'maintenance');
  const outOfStockItems = inventory.filter(item => item.current_stock === 0);

  const alerts = [
    ...lowStockItems.slice(0, 2).map(item => ({
      type: 'warning' as const,
      message: `Low stock alert: ${item.product_name} (${item.current_stock} units left)`
    })),
    ...vehiclesInMaintenance.slice(0, 1).map(vehicle => ({
      type: 'info' as const,
      message: `Vehicle ${vehicle.vehicle_number} is currently in maintenance`
    })),
    ...outOfStockItems.slice(0, 1).map(item => ({
      type: 'error' as const,
      message: `Out of stock: ${item.product_name}`
    }))
  ].slice(0, 3);

  // If no alerts, show positive messages
  if (alerts.length === 0) {
    alerts.push({
      type: 'info' as const,
      message: 'All systems operating normally'
    });
  }

  const kpiData = [
    { 
      title: 'Total Employees', 
      value: totalEmployees.toString(), 
      icon: Users, 
      change: `${totalEmployees > 0 ? '+' : ''}${totalEmployees}`, 
      trend: 'up' as const 
    },
    { 
      title: 'Active Vehicles', 
      value: activeVehicles.toString(), 
      icon: Truck, 
      change: `${activeVehicles}/${vehicles.length}`, 
      trend: activeVehicles > 0 ? 'up' as const : 'down' as const 
    },
    { 
      title: 'Inventory Items', 
      value: totalInventoryItems.toString(), 
      icon: Package, 
      change: `${lowStockItems.length} low stock`, 
      trend: lowStockItems.length > 0 ? 'down' as const : 'up' as const 
    },
    { 
      title: 'Inventory Value', 
      value: `$${Math.round(totalInventoryValue).toLocaleString()}`, 
      icon: DollarSign, 
      change: `${totalInventoryItems} items`, 
      trend: 'up' as const 
    }
  ];

  // Generate sales data from stock movements (last 6 months)
  const salesData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const monthName = month.toLocaleDateString('en-US', { month: 'short' });
    
    const monthMovements = stockMovements.filter(movement => {
      const movementDate = new Date(movement.created_at);
      return movementDate.getMonth() === month.getMonth() && 
             movementDate.getFullYear() === month.getFullYear();
    });
    
    const sales = monthMovements
      .filter(m => m.movement_type === 'outbound')
      .reduce((sum, m) => sum + (m.total_cost || 0), 0);
    
    const deliveries = monthMovements.filter(m => m.movement_type === 'outbound').length;
    
    return {
      month: monthName,
      sales: Math.round(sales),
      deliveries
    };
  });

  // Calculate role distribution instead of department distribution
  const roleCounts = employees.reduce((acc, emp) => {
    const role = emp.role || 'employee';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleData = Object.entries(roleCounts).map(([name, count], index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const roleLabels = {
      admin: 'Admin',
      employee: 'Employee', 
      driver: 'Driver'
    };
    
    return {
      name: roleLabels[name as keyof typeof roleLabels] || name,
      value: Math.round((count / totalEmployees) * 100),
      color: colors[index % colors.length]
    };
  });

  // Schedule maintenance mutation
  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async () => {
      // Get a random active vehicle for demonstration
      const activeVehicles = vehicles.filter(v => v.status === 'active');
      if (activeVehicles.length === 0) {
        throw new Error('No active vehicles available for maintenance scheduling');
      }
      
      const randomVehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)];
      const maintenanceDate = new Date();
      maintenanceDate.setDate(maintenanceDate.getDate() + 7); // Schedule for next week
      
      const { data, error } = await supabase
        .from('maintenance_logs')
        .insert({
          vehicle_id: randomVehicle.id,
          maintenance_type: 'Scheduled Maintenance',
          service_date: maintenanceDate.toISOString().split('T')[0],
          description: 'Routine maintenance check scheduled from dashboard',
          performed_by: 'System Auto-Schedule'
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-vehicles'] });
      toast({
        title: "Maintenance Scheduled",
        description: "Vehicle maintenance has been scheduled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule maintenance.",
        variant: "destructive",
      });
    }
  });

  // Generate report action
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportData = {
        totalEmployees,
        activeVehicles,
        totalInventoryItems,
        totalInventoryValue,
        lowStockCount: lowStockItems.length,
        generatedAt: new Date().toISOString()
      };

      // Save the report to database
      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert({
          title: `Operational Report - ${new Date().toLocaleDateString()}`,
          data: reportData,
          generated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return { reportData, savedReport };
    },
    onSuccess: ({ reportData }) => {
      setCurrentReportData(reportData);
      setShowReportDisplay(true);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: "Report Generated",
        description: "Operational report has been generated and saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      });
    }
  });

  // Quick action handlers
  const handleAddEmployee = () => {
    setShowAddEmployeeDialog(true);
  };

  const handleScheduleMaintenance = () => {
    if (vehicles.length === 0) {
      toast({
        title: "No Vehicles",
        description: "No vehicles available in the system to schedule maintenance.",
        variant: "destructive",
      });
      return;
    }
    scheduleMaintenanceMutation.mutate();
  };

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className={`text-sm flex items-center ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {kpi.change}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <kpi.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement Trends</CardTitle>
            <CardDescription>Monthly stock movement overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="deliveries" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Role Distribution</CardTitle>
            <CardDescription>Employee allocation by role</CardDescription>
          </CardHeader>
          <CardContent>
            {totalEmployees > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {roleData.map((role, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-sm text-gray-600">{role.name}: {role.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No employee data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  alert.type === 'error' ? 'bg-red-50 border-red-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              onClick={handleAddEmployee}
              className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <p className="font-medium text-blue-900">Add New Employee</p>
              <p className="text-sm text-blue-600">Create a new user account</p>
            </button>
            <button 
              onClick={handleScheduleMaintenance}
              disabled={scheduleMaintenanceMutation.isPending}
              className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <p className="font-medium text-green-900">
                {scheduleMaintenanceMutation.isPending ? 'Scheduling...' : 'Schedule Vehicle Maintenance'}
              </p>
              <p className="text-sm text-green-600">Auto-schedule maintenance for a vehicle</p>
            </button>
            <button 
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <p className="font-medium text-purple-900">
                {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
              </p>
              <p className="text-sm text-purple-600">Export operational data summary</p>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog 
        open={showAddEmployeeDialog} 
        onOpenChange={setShowAddEmployeeDialog} 
      />

      {/* Report Display Dialog */}
      <ReportDisplay
        open={showReportDisplay}
        onOpenChange={setShowReportDisplay}
        reportData={currentReportData}
      />
    </div>
  );
};

export default AdminDashboard;
