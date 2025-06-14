import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<'admin' | 'employee' | 'driver'>('employee');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      console.log('=== STARTING EMPLOYEE CREATION ===');
      console.log('Employee data:', employeeData);
      
      try {
        // Step 1: Create the user account
        console.log('Step 1: Creating user account...');
        const redirectUrl = `${window.location.origin}/`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: employeeData.email,
          password: 'TempPassword123!',
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: employeeData.firstName,
              last_name: employeeData.lastName
            }
          }
        });

        if (authError) {
          console.error('❌ Auth error:', authError);
          throw new Error(`Authentication failed: ${authError.message}`);
        }

        if (!authData.user) {
          console.error('❌ No user returned from auth');
          throw new Error('Failed to create user account - no user returned');
        }

        console.log('✅ User created successfully:', authData.user.id);

        // Step 2: Create profile
        console.log('Step 2: Creating profile...');
        console.log('Profile data to insert:', {
          id: authData.user.id,
          email: employeeData.email,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          phone: employeeData.phone,
          department: employeeData.department,
          employee_id: employeeData.employeeId
        });
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: employeeData.email,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            phone: employeeData.phone,
            department: employeeData.department,
            employee_id: employeeData.employeeId
          })
          .select()
          .single();

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          console.error('Profile error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        console.log('✅ Profile created successfully:', profileData);

        // Step 3: Create role
        console.log('Step 3: Creating role...');
        console.log('Role data to insert:', {
          user_id: authData.user.id,
          role: employeeData.role
        });
        
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: employeeData.role
          })
          .select()
          .single();

        if (roleError) {
          console.error('❌ Role creation error:', roleError);
          console.error('Role error details:', {
            code: roleError.code,
            message: roleError.message,
            details: roleError.details,
            hint: roleError.hint
          });
          throw new Error(`Role creation failed: ${roleError.message}`);
        }

        console.log('✅ Role created successfully:', roleData);
        console.log('=== EMPLOYEE CREATION COMPLETED SUCCESSFULLY ===');
        
        return authData.user;

      } catch (error) {
        console.error('❌ Detailed error in employee creation:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ Mutation completed successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Success",
        description: "Employee added successfully. A temporary password has been set.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ Mutation failed with error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: error.message || "Failed to add employee.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setDepartment('');
    setEmployeeId('');
    setRole('employee');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMITTED ===');
    console.log('Form data:', {
      email,
      firstName,
      lastName,
      phone,
      department,
      employeeId,
      role
    });
    
    addEmployeeMutation.mutate({
      email,
      firstName,
      lastName,
      phone,
      department,
      employeeId,
      role
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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
            <Select value={role} onValueChange={(value: 'admin' | 'employee' | 'driver') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addEmployeeMutation.isPending}>
              {addEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
