
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const RoleUpdater = () => {
  const { updateUserRole, profile } = useAuth();

  const handleRoleUpdate = async (role: 'admin' | 'employee' | 'driver') => {
    await updateUserRole(role);
  };

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
        <Button 
          onClick={() => handleRoleUpdate('admin')} 
          className="w-full"
          variant="outline"
        >
          Set Role to Admin
        </Button>
      </CardContent>
    </Card>
  );
};

export default RoleUpdater;
