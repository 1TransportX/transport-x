import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Employee } from '@/types/employee';

interface EditEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditEmployeeDialog: React.FC<EditEmployeeDialogProps> = ({ employee, open, onOpenChange }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<'admin' | 'driver'>('driver');
  const [isActive, setIsActive] = useState(true);
  
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name || '');
      setLastName(employee.last_name || '');
      setPhone(employee.phone || '');
      setDepartment(employee.department || '');
      setEmployeeId(employee.employee_id || '');
      setRole(employee.role);
      setIsActive(employee.is_active);
    }
  }, [employee]);

  const updateEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      console.log('=== Starting employee update with data:', employeeData);
      console.log('=== Current employee role:', employee.role);
      console.log('=== New role to set:', employeeData.role);
      
      // Prepare the update data for profiles
      const profileUpdateData: any = {
        first_name: employeeData.firstName,
        last_name: employeeData.lastName,
        phone: employeeData.phone,
        department: employeeData.department,
        is_active: employeeData.isActive
      };

      // Only include employee_id if it's not empty, otherwise set to null
      if (employeeData.employeeId && employeeData.employeeId.trim() !== '') {
        profileUpdateData.employee_id = employeeData.employeeId.trim();
      } else {
        profileUpdateData.employee_id = null;
      }

      console.log('=== Updating profile with data:', profileUpdateData);

      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', employee.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('=== Profile updated successfully');

      // Handle role updates - check if role actually changed
      if (employee.role !== employeeData.role) {
        console.log('=== Role changed, updating user_roles table');
        
        // First, delete any existing roles for this user
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', employee.id);

        if (deleteError) {
          console.error('Error deleting existing roles:', deleteError);
          throw deleteError;
        }

        console.log('=== Deleted existing roles');

        // Insert the new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: employee.id,
            role: employeeData.role
          });

        if (roleError) {
          console.error('Role insert error:', roleError);
          throw roleError;
        }

        console.log('=== New role inserted successfully:', employeeData.role);
      } else {
        console.log('=== Role unchanged, skipping role update');
      }

      console.log('=== Employee updated successfully');
      return { updatedRole: employee.role !== employeeData.role };
    },
    onSuccess: async (result) => {
      console.log('=== Update mutation successful, result:', result);
      
      // Invalidate the employees query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      // If the current user's role was updated, refresh their auth profile
      if (user && user.id === employee.id && result.updatedRole) {
        console.log('=== Current user role was updated, refreshing auth profile');
        
        // Add a delay to ensure database changes are committed
        setTimeout(async () => {
          console.log('=== Calling refreshProfile after delay');
          await refreshProfile();
          
          // Close dialog after profile refresh
          setTimeout(() => {
            console.log('=== Closing dialog');
            onOpenChange(false);
          }, 500);
        }, 1000);
      } else {
        // Close dialog immediately if it's not the current user
        onOpenChange(false);
      }
      
      toast({
        title: "Success",
        description: "Employee updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Update employee mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update employee.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== Form submitted with role:', role);
    updateEmployeeMutation.mutate({
      firstName,
      lastName,
      phone,
      department,
      employeeId,
      role,
      isActive
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'driver') => {
              console.log('=== Role selection changed to:', value);
              setRole(value);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Active Employee</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateEmployeeMutation.isPending}>
              {updateEmployeeMutation.isPending ? 'Updating...' : 'Update Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
