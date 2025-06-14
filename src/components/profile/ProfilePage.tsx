
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Calendar, Building } from 'lucide-react';

const ProfilePage = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    employee_id: profile?.employee_id || ''
  });

  // Fetch detailed profile data
  const { data: detailedProfile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: typeof formData) => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const currentProfile = detailedProfile || profile;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and account settings</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  first_name: currentProfile?.first_name || '',
                  last_name: currentProfile?.last_name || '',
                  phone: currentProfile?.phone || '',
                  department: currentProfile?.department || '',
                  employee_id: currentProfile?.employee_id || ''
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your basic profile information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Enter your department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    placeholder="Enter your employee ID"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">
                      {currentProfile?.first_name && currentProfile?.last_name
                        ? `${currentProfile.first_name} ${currentProfile.last_name}`
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{currentProfile?.email || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{currentProfile?.phone || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{currentProfile?.department || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="font-medium">{currentProfile?.employee_id || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Hire Date</p>
                    <p className="font-medium">
                      {currentProfile?.hire_date 
                        ? new Date(currentProfile.hire_date).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and role information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">{profile?.role || 'Employee'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="font-medium text-green-600">
                  {currentProfile?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">
                {currentProfile?.created_at 
                  ? new Date(currentProfile.created_at).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
