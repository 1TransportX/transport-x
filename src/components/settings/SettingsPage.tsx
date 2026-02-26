import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ResponsiveTabs, ResponsiveTabsList, ResponsiveTabsTrigger, ResponsiveTabsContent } from '@/components/ui/responsive-tabs';
import { Settings, Users, Shield, Database, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserWithRole {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  role: 'admin' | 'driver';
}

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    lowStockAlerts: true,
    maintenanceAlerts: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      return (profilesData || []).map(profile => ({
        ...profile,
        role: ((rolesData || []).find(r => r.user_id === profile.id)?.role || 'driver') as 'admin' | 'driver'
      })) as UserWithRole[];
    }
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string, isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({
        title: "Success",
        description: "User status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: 'admin' | 'driver' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'driver': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Configure system settings and user permissions.</p>
      </div>

      <ResponsiveTabs defaultValue="users" className="w-full">
        <ResponsiveTabsList className={isMobile ? "grid grid-cols-2 gap-1 h-auto p-1" : "grid w-full grid-cols-4"}>
          <ResponsiveTabsTrigger value="users" className={isMobile ? "flex flex-col items-center gap-1 p-3 h-auto" : "flex items-center gap-2"}>
            <Users className="h-4 w-4" />
            <span className={isMobile ? "text-xs" : ""}>
              {isMobile ? "Users" : "User Management"}
            </span>
          </ResponsiveTabsTrigger>
          <ResponsiveTabsTrigger value="permissions" className={isMobile ? "flex flex-col items-center gap-1 p-3 h-auto" : "flex items-center gap-2"}>
            <Shield className="h-4 w-4" />
            <span className={isMobile ? "text-xs" : ""}>
              {isMobile ? "Roles" : "Permissions"}
            </span>
          </ResponsiveTabsTrigger>
          <ResponsiveTabsTrigger value="system" className={isMobile ? "flex flex-col items-center gap-1 p-3 h-auto" : "flex items-center gap-2"}>
            <Database className="h-4 w-4" />
            <span className={isMobile ? "text-xs" : ""}>System</span>
          </ResponsiveTabsTrigger>
          <ResponsiveTabsTrigger value="notifications" className={isMobile ? "flex flex-col items-center gap-1 p-3 h-auto" : "flex items-center gap-2"}>
            <Bell className="h-4 w-4" />
            <span className={isMobile ? "text-xs" : ""}>
              {isMobile ? "Alerts" : "Notifications"}
            </span>
          </ResponsiveTabsTrigger>
        </ResponsiveTabsList>

        <ResponsiveTabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={(checked) => 
                                updateUserStatusMutation.mutate({ 
                                  userId: user.id, 
                                  isActive: checked 
                                })
                              }
                            />
                            <Label className="text-sm">
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Label>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </ResponsiveTabsContent>

        <ResponsiveTabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Admin Permissions</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Full access to all features</li>
                    <li>User management and role assignment</li>
                    <li>System settings configuration</li>
                    <li>Fleet and vehicle management</li>
                    <li>Warehouse and inventory management</li>
                    <li>Employee management</li>
                    <li>Route optimization and planning</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Driver Permissions</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Fleet and vehicle information access</li>
                    <li>Delivery management</li>
                    <li>Fuel log recording</li>
                    <li>View own profile and attendance</li>
                    <li>Submit leave requests</li>
                    <li>Route completion tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </ResponsiveTabsContent>

        <ResponsiveTabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Database Status</h3>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Authentication</h3>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Total Users</h3>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Active Users</h3>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ResponsiveTabsContent>

        <ResponsiveTabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-gray-600">Alert when inventory is running low</p>
                  </div>
                  <Switch
                    checked={notifications.lowStockAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, lowStockAlerts: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Alerts</Label>
                    <p className="text-sm text-gray-600">Alert for vehicle maintenance schedules</p>
                  </div>
                  <Switch
                    checked={notifications.maintenanceAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, maintenanceAlerts: checked }))
                    }
                  />
                </div>
                
                <Button className="w-full">
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </ResponsiveTabsContent>
      </ResponsiveTabs>
    </div>
  );
};

export default SettingsPage;
