
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const RoleUpdater = () => {
  const { updateUserRole, profile } = useAuth();
  const queryClient = useQueryClient();

  const handleRoleUpdate = async (role: 'admin' | 'employee' | 'driver') => {
    console.log('=== RoleUpdater: Updating role to:', role);
    await updateUserRole(role);
    
    // Invalidate employees query to refresh the employee list
    console.log('=== RoleUpdater: Invalidating employees query');
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const canSetAdminRole = profile?.role === 'admin';

  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Update Your Role</CardTitle>
        <p className="text-sm text-gray-600">
          Current role: <span className="font-semibold">{profile?.role || 'unknown'}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          onClick={() => handleRoleUpdate('driver')} 
          className="w-full"
          variant="outline"
        >
          Set Role to Driver
        </Button>
        <Button 
          onClick={() => handleRoleUpdate('employee')} 
          className="w-full"
          variant="outline"
        >
          Set Role to Employee
        </Button>
        {canSetAdminRole && (
          <Button 
            onClick={() => handleRoleUpdate('admin')} 
            className="w-full"
            variant="outline"
          >
            Set Role to Admin
          </Button>
        )}
        {!canSetAdminRole && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Only administrators can assign admin roles
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleUpdater;
