
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddEmployeeDialog from './AddEmployeeDialog';
import EditEmployeeDialog from './EditEmployeeDialog';
import { Employee } from '@/types/employee';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingFallback } from '@/components/ui/loading-fallback';

const EmployeeList = () => {
  console.log('EmployeeList - Component rendering started');
  console.log('EmployeeList - Environment check:', {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    viewport: typeof window !== 'undefined' ? {
      width: window.innerWidth,
      height: window.innerHeight
    } : 'Server'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up real-time subscription for user_roles changes
  useEffect(() => {
    console.log('EmployeeList - Setting up real-time subscription');
    
    try {
      const channel = supabase
        .channel('user-roles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles'
          },
          (payload) => {
            console.log('EmployeeList - User role changed:', payload);
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }
        )
        .subscribe();

      return () => {
        console.log('EmployeeList - Cleaning up user_roles subscription');
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('EmployeeList - Error setting up subscription:', error);
    }
  }, [queryClient]);

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async (): Promise<Employee[]> => {
      console.log('EmployeeList - Fetching employees with latest roles...');
      
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('EmployeeList - Error fetching profiles:', profilesError);
          throw profilesError;
        }

        console.log('EmployeeList - Fetched profiles:', profilesData);

        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.error('EmployeeList - Error fetching roles:', rolesError);
          throw rolesError;
        }

        console.log('EmployeeList - Fetched roles:', rolesData);

        const employeesWithRoles: Employee[] = profilesData.map(profile => {
          const userRole = rolesData.find(role => role.user_id === profile.id);
          const role = userRole?.role || 'driver';
          
          console.log(`EmployeeList - Profile ${profile.email} has role:`, role);
          
          return {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone,
            department: profile.department,
            hire_date: profile.hire_date,
            is_active: profile.is_active,
            role: role as 'admin' | 'driver',
            created_at: profile.created_at,
            updated_at: profile.updated_at
          };
        });

        console.log('EmployeeList - Final employees with roles:', employeesWithRoles);
        return employeesWithRoles;
      } catch (error) {
        console.error('EmployeeList - Query function error:', error);
        throw error;
      }
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      console.log('EmployeeList - Starting employee deletion for ID:', employeeId);
      
      try {
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', employeeId);
        
        if (roleError) {
          console.error('EmployeeList - Error deleting user roles:', roleError);
          throw roleError;
        }
        
        console.log('EmployeeList - Deleted user roles successfully');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', employeeId);
        
        if (profileError) {
          console.error('EmployeeList - Error deleting profile:', profileError);
          throw profileError;
        }
        
        console.log('EmployeeList - Deleted profile successfully');
        
        const { error: authError } = await supabase.auth.admin.deleteUser(employeeId);
        
        if (authError) {
          console.error('EmployeeList - Error deleting auth user:', authError);
          console.log('EmployeeList - Auth user deletion failed but continuing...');
        } else {
          console.log('EmployeeList - Deleted auth user successfully');
        }
      } catch (error) {
        console.error('EmployeeList - Delete mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Success",
        description: "Employee deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('EmployeeList - Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredEmployees = employees.filter(employee =>
    employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'driver': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (error) {
    console.error('EmployeeList - Query error:', error);
    return (
      <div className="w-full p-6">
        <div className="text-red-600">
          Error loading employees: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log('EmployeeList - Showing loading state');
    return <LoadingFallback />;
  }

  try {
    console.log('EmployeeList - Rendering main component');
    return (
      <ErrorBoundary>
        <div className="w-full">
          <div className="w-full p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Employee Management</h2>
                <p className="text-sm text-gray-600 mt-1">Manage employee records, roles, and information.</p>
              </div>
              <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>

            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <div className="space-y-3 p-3">
                    {filteredEmployees.map((employee) => (
                      <Card key={employee.id}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">
                                  {employee.first_name && employee.last_name 
                                    ? `${employee.first_name} ${employee.last_name}`
                                    : 'N/A'
                                  }
                                </h3>
                                <p className="text-sm text-gray-600">{employee.email}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingEmployee(employee)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                                  disabled={deleteEmployeeMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium">Department:</span>
                                <div>{employee.department || 'N/A'}</div>
                              </div>
                              <div>
                                <span className="font-medium">Role:</span>
                                <div>
                                  <Badge className={getRoleBadgeColor(employee.role)}>
                                    {employee.role}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <div>
                                  <Badge variant={employee.is_active ? "default" : "secondary"}>
                                    {employee.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Hire Date:</span>
                                <div>
                                  {employee.hire_date 
                                    ? new Date(employee.hire_date).toLocaleDateString()
                                    : 'N/A'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[100px]">Department</TableHead>
                        <TableHead className="min-w-[80px]">Role</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Hire Date</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.first_name && employee.last_name 
                              ? `${employee.first_name} ${employee.last_name}`
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(employee.role)}>
                              {employee.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.is_active ? "default" : "secondary"}>
                              {employee.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {employee.hire_date 
                              ? new Date(employee.hire_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingEmployee(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                                disabled={deleteEmployeeMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <AddEmployeeDialog 
              open={showAddDialog} 
              onOpenChange={setShowAddDialog} 
            />
            
            {editingEmployee && (
              <EditEmployeeDialog 
                employee={editingEmployee}
                open={!!editingEmployee}
                onOpenChange={() => setEditingEmployee(null)}
              />
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('EmployeeList - Render error:', error);
    throw error;
  }
};

export default EmployeeList;
