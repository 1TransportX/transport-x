
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import { useAuth } from '@/hooks/useAuth';
import DriverLeaveRequests from '@/components/drivers/DriverLeaveRequests';

const ProfilePage = () => {
  const { profile } = useAuth();

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <ResponsiveHeader
        title="Profile"
        subtitle="Manage your profile and leave requests"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">First Name</label>
              <p className="text-gray-900">{profile?.first_name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <p className="text-gray-900">{profile?.last_name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <p className="text-gray-900 capitalize">{profile?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Department</label>
              <p className="text-gray-900">{profile?.department || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <DriverLeaveRequests />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
