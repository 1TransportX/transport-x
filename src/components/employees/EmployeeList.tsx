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
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import AddEmployeeDialog from './AddEmployeeDialog';
import EditEmployeeDialog from './EditEmployeeDialog';
import { Employee } from '@/types/employee';

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up real-time subscription for user_roles changes
  useEffect(() => {
    console.log('Setting up real-time subscription for user_roles changes');
    
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
          console.log('User role changed:', payload);
          // Invalidate and refetch employees when any role changes
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up user_roles subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async (): Promise<Employee[]> => {
      console.log('Fetching employees with latest roles...');
      
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Fetched profiles:', profilesData);

      // Then get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      console.log('Fetched roles:', rolesData);

      // Combine the data
      const employeesWithRoles: Employee[] = profilesData.map(profile => {
        const userRole = rolesData.find(role => role.user_id === profile.id);
        const role = userRole?.role || 'driver';
        
        console.log(`Profile ${profile.email} has role:`, role);
        
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

      console.log('Final employees with roles:', employeesWithRoles);
      return employeesWithRoles;
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      console.log('=== Starting employee deletion for ID:', employeeId);
      
      // First, delete from user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', employeeId);
      
      if (roleError) {
        console.error('Error deleting user roles:', roleError);
        throw roleError;
      }
      
      console.log('=== Deleted user roles successfully');
      
      // Then delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', employeeId);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }
      
      console.log('=== Deleted profile successfully');
      
      // Finally, delete the auth user (this will cascade to other related tables)
      const { error: authError } = await supabase.auth.admin.deleteUser(employeeId);
      
      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Don't throw here as the profile is already deleted
        console.log('=== Auth user deletion failed but continuing...');
      } else {
        console.log('=== Deleted auth user successfully');
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
      console.error('Error deleting employee:', error);
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
    console.error('Employee list error:', error);
    return (
      <div className="p-6">
        <div className="text-red-600">
          Error loading employees: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <ResponsiveHeader
        title="Employee Management"
        subtitle="Manage employee records, roles, and information."
      >
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </ResponsiveHeader>

      <Card>
        <CardHeader>
          <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
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
  );
};

export default EmployeeList;
