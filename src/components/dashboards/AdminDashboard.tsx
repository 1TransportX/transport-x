
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Package, DollarSign, TrendingUp, AlertTriangle, RefreshCw, UserPlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import AddEmployeeDialog from '@/components/employees/AddEmployeeDialog';
import ReportDisplay from '@/components/reports/ReportDisplay';
import AssignRouteToDriverDialog from './AssignRouteToDriverDialog';

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showReportDisplay, setShowReportDisplay] = useState(false);
  const [showAssignRouteDialog, setShowAssignRouteDialog] = useState(false);
  const [currentReportData, setCurrentReportData] = useState(null);

  // Fetch employees with their roles and refresh every 30 seconds
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['dashboard-employees'],
    queryFn: async () => {
      console.log('=== Fetching employees for dashboard...');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      
      console.log('=== Raw employee data:', data);
      
      const processedEmployees = data.map(profile => ({
        ...profile,
        role: profile.user_roles?.[0]?.role || 'driver'
      }));
      
      console.log('=== Processed employees with roles:', processedEmployees);
      
      return processedEmployees;
    },
    refetchInterval: 30000,
    staleTime: 10000
  });

  // Fetch vehicles with refresh interval
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['dashboard-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    staleTime: 10000
  });

  // Fetch deliveries with refresh interval
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['dashboard-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    staleTime: 10000
  });

  const isLoading = employeesLoading || vehiclesLoading || deliveriesLoading;

  // Calculate real KPI data
  const totalEmployees = employees.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter(d => d.status === 'completed').length;

  // Generate real alerts based on data
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'maintenance');
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const overdueDeliveries = deliveries.filter(d => 
    d.status === 'pending' && d.scheduled_date && new Date(d.scheduled_date) < new Date()
  );

  const alerts = [
    ...vehiclesInMaintenance.slice(0, 2).map(vehicle => ({
      type: 'info' as const,
      message: `Vehicle ${vehicle.vehicle_number} is currently in maintenance`
    })),
    ...overdueDeliveries.slice(0, 2).map(delivery => ({
      type: 'warning' as const,
      message: `Overdue delivery: ${delivery.customer_name} (${delivery.delivery_number})`
    })),
    ...(pendingDeliveries.length > 5 ? [{
      type: 'warning' as const,
      message: `${pendingDeliveries.length} pending deliveries require attention`
    }] : [])
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
      title: 'Total Drivers', 
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
      title: 'Total Deliveries', 
      value: totalDeliveries.toString(), 
      icon: Package, 
      change: `${completedDeliveries} completed`, 
      trend: completedDeliveries > 0 ? 'up' as const : 'down' as const 
    },
    { 
      title: 'Completion Rate', 
      value: `${totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0}%`, 
      icon: DollarSign, 
      change: `${completedDeliveries}/${totalDeliveries}`, 
      trend: 'up' as const 
    }
  ];

  // Generate delivery data from last 6 months
  const deliveryData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const monthName = month.toLocaleDateString('en-US', { month: 'short' });
    
    const monthDeliveries = deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.created_at);
      return deliveryDate.getMonth() === month.getMonth() && 
             deliveryDate.getFullYear() === month.getFullYear();
    });
    
    const completed = monthDeliveries.filter(d => d.status === 'completed').length;
    const pending = monthDeliveries.filter(d => d.status === 'pending').length;
    
    return {
      month: monthName,
      completed,
      pending,
      total: monthDeliveries.length
    };
  });

  // Calculate role distribution
  const roleCounts = employees.reduce((acc, emp) => {
    const role = emp.role || 'driver';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('=== Role counts:', roleCounts);
  console.log('=== Total employees for percentage calc:', totalEmployees);

  const roleData = Object.entries(roleCounts).map(([roleKey, count], index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const roleLabels = {
      admin: 'Admin',
      driver: 'Driver'
    };
    
    const percentage = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
    
    console.log(`=== Role ${roleKey}: ${count} employees = ${percentage}%`);
    
    return {
      name: roleLabels[roleKey as keyof typeof roleLabels] || roleKey,
      value: count,
      percentage: percentage,
      color: colors[index % colors.length]
    };
  });

  console.log('=== Final role data for chart:', roleData);

  // Schedule maintenance mutation
  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async () => {
      const activeVehicles = vehicles.filter(v => v.status === 'active');
      if (activeVehicles.length === 0) {
        throw new Error('No active vehicles available for maintenance scheduling');
      }
      
      const randomVehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)];
      const maintenanceDate = new Date();
      maintenanceDate.setDate(maintenanceDate.getDate() + 7);
      
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
      console.log('=== Starting report generation...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User error:', userError);
        throw new Error('User not authenticated');
      }

      console.log('=== Current user:', user.id);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportData = {
        totalEmployees,
        activeVehicles,
        totalDeliveries,
        completedDeliveries,
        completionRate: totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0,
        pendingDeliveries: pendingDeliveries.length,
        generatedAt: new Date().toISOString()
      };

      console.log('=== Report data prepared:', reportData);

      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert({
          title: `Operational Report - ${new Date().toLocaleDateString()}`,
          data: reportData,
          generated_by: user.id
        })
        .select()
        .single();

      console.log('=== Insert result:', { data: savedReport, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return { reportData, savedReport };
    },
    onSuccess: ({ reportData }) => {
      console.log('=== Report generation successful');
      setCurrentReportData(reportData);
      setShowReportDisplay(true);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: "Report Generated",
        description: "Operational report has been generated and saved.",
      });
    },
    onError: (error) => {
      console.error('=== Report generation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report.",
        variant: "destructive",
      });
    }
  });

  // Quick action handlers
  const handleAddEmployee = () => {
    setShowAddEmployeeDialog(true);
  };

  const handleAssignRoute = () => {
    setShowAssignRouteDialog(true);
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

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-employees'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-deliveries'] });
    
    toast({
      title: "Dashboard Refreshed",
      description: "All dashboard data has been updated.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefreshAll}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className={`text-xs md:text-sm flex items-center ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {kpi.change}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 md:p-3 rounded-full">
                  <kpi.icon className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
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
            <CardTitle>Delivery Trends</CardTitle>
            <CardDescription>Monthly delivery overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Role Distribution</CardTitle>
            <CardDescription>Employee allocation by role ({totalEmployees} total employees)</CardDescription>
          </CardHeader>
          <CardContent>
            {totalEmployees > 0 && roleData.length > 0 ? (
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
                    <Tooltip 
                      formatter={(value, name) => [`${value} employees`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {roleData.map((role, index) => (
                    <div key={index} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-sm text-gray-600">{role.name}</span>
                      </div>
                      <span className="text-sm font-medium">{role.value} ({role.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-medium">No employee data available</p>
                  <p className="text-sm">Add some drivers to see the role distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Quick Actions */}
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
              <p className="font-medium text-blue-900">Add New Driver</p>
              <p className="text-sm text-blue-600">Create a new driver account</p>
            </button>
            <button 
              onClick={handleAssignRoute}
              className="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <p className="font-medium text-indigo-900">Assign Routes to Driver</p>
              <p className="text-sm text-indigo-600">Assign delivery routes to available drivers</p>
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

      {/* Assign Route Dialog */}
      <AssignRouteToDriverDialog
        isOpen={showAssignRouteDialog}
        onClose={() => setShowAssignRouteDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['deliveries'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-deliveries'] });
        }}
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
