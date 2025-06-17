
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AddDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddDriverDialog: React.FC<AddDriverDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'admin' | 'driver'>('driver');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      console.log('=== STARTING DRIVER CREATION ===');
      console.log('Driver data:', driverData);
      
      try {
        // Step 1: Create the user account
        console.log('Step 1: Creating user account...');
        const redirectUrl = `${window.location.origin}/`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: driverData.email,
          password: 'TempPassword123!',
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: driverData.firstName,
              last_name: driverData.lastName
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
        
        const profileData = {
          id: authData.user.id,
          email: driverData.email,
          first_name: driverData.firstName,
          last_name: driverData.lastName,
          phone: driverData.phone,
          department: driverData.department
        };
        
        console.log('Profile data to insert:', profileData);
        
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
          
        if (existingProfile) {
          console.log('Profile already exists, updating instead...');
          const { data: updateResult, error: updateError } = await supabase
            .from('profiles')
            .update({
              first_name: driverData.firstName,
              last_name: driverData.lastName,
              phone: driverData.phone,
              department: driverData.department
            })
            .eq('id', authData.user.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Profile update error:', updateError);
            throw new Error(`Profile update failed: ${updateError.message}`);
          }
          
          console.log('✅ Profile updated successfully:', updateResult);
        } else {
          console.log('Creating new profile...');
          const { data: insertResult, error: insertError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (insertError) {
            console.error('❌ Profile creation error:', insertError);
            
            if (insertError.code === '42501' || insertError.message?.includes('permission')) {
              throw new Error('Permission denied: Admin privileges required to create driver profiles');
            }
            
            throw new Error(`Profile creation failed: ${insertError.message}`);
          }

          console.log('✅ Profile created successfully:', insertResult);
        }

        // Step 3: Create role
        console.log('Step 3: Creating role...');
        
        // Check if role already exists
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();
        
        if (existingRole) {
          console.log('Role already exists, updating...');
          const { data: roleUpdateResult, error: roleUpdateError } = await supabase
            .from('user_roles')
            .update({ role: driverData.role })
            .eq('user_id', authData.user.id)
            .select()
            .single();

          if (roleUpdateError) {
            console.error('❌ Role update error:', roleUpdateError);
            throw new Error(`Role update failed: ${roleUpdateError.message}`);
          }
          
          console.log('✅ Role updated successfully:', roleUpdateResult);
        } else {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: driverData.role
            })
            .select()
            .single();

          if (roleError) {
            console.error('❌ Role creation error:', roleError);
            throw new Error(`Role creation failed: ${roleError.message}`);
          }

          console.log('✅ Role created successfully:', roleData);
        }

        console.log('=== DRIVER CREATION COMPLETED SUCCESSFULLY ===');
        
        return authData.user;

      } catch (error) {
        console.error('❌ Detailed error in driver creation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ Mutation completed successfully');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: "Success",
        description: "Driver added successfully. A temporary password has been set.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ Mutation failed with error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add driver.",
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
    setRole('driver');
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
      role
    });
    
    addDriverMutation.mutate({
      email,
      firstName,
      lastName,
      phone,
      department,
      role
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
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

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'driver') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addDriverMutation.isPending}>
              {addDriverMutation.isPending ? 'Adding...' : 'Add Driver'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDriverDialog;
