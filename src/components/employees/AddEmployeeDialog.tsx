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
        // Step 1: Create the user account using regular signUp
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

        // Step 2: Handle profile creation/update
        console.log('Step 2: Handling profile...');
        
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileCheckError) {
          console.error('❌ Error checking existing profile:', profileCheckError);
          throw new Error(`Profile check failed: ${profileCheckError.message}`);
        }

        console.log('Profile check result:', existingProfile ? 'exists' : 'does not exist');

        if (existingProfile) {
          // Profile exists, update it
          console.log('Updating existing profile...');
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              first_name: employeeData.firstName,
              last_name: employeeData.lastName,
              phone: employeeData.phone,
              department: employeeData.department,
              employee_id: employeeData.employeeId
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('❌ Profile update error:', profileError);
            throw new Error(`Profile update failed: ${profileError.message}`);
          }
          console.log('✅ Profile updated successfully');
        } else {
          // Profile doesn't exist, create it
          console.log('Creating new profile...');
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: employeeData.email,
              first_name: employeeData.firstName,
              last_name: employeeData.lastName,
              phone: employeeData.phone,
              department: employeeData.department,
              employee_id: employeeData.employeeId
            });

          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
          console.log('✅ Profile created successfully');
        }

        // Step 3: Handle role creation/update
        console.log('Step 3: Handling role...');
        
        const { data: existingRole, error: roleCheckError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (roleCheckError) {
          console.error('❌ Error checking existing role:', roleCheckError);
          throw new Error(`Role check failed: ${roleCheckError.message}`);
        }

        console.log('Role check result:', existingRole ? 'exists' : 'does not exist');

        if (existingRole) {
          // Role exists, update it
          console.log('Updating existing role...');
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: employeeData.role })
            .eq('user_id', authData.user.id);

          if (roleError) {
            console.error('❌ Role update error:', roleError);
            throw new Error(`Role update failed: ${roleError.message}`);
          }
          console.log('✅ Role updated successfully');
        } else {
          // Role doesn't exist, create it
          console.log('Creating new role...');
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: employeeData.role
            });

          if (roleError) {
            console.error('❌ Role creation error:', roleError);
            throw new Error(`Role creation failed: ${roleError.message}`);
          }
          console.log('✅ Role created successfully');
        }

        console.log('=== EMPLOYEE CREATION COMPLETED SUCCESSFULLY ===');
        return authData.user;

      } catch (error) {
        console.error('=== EMPLOYEE CREATION FAILED ===');
        console.error('Error details:', error);
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
      console.error('❌ Mutation failed:', error);
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
