
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import LeaveRequestDialog from './LeaveRequestDialog';

interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

const DriverLeaveRequests = () => {
  const { profile } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['driver-leave-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!profile?.id
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>My Leave Requests</span>
          </CardTitle>
          <Button onClick={() => setShowDialog(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Request Leave</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {leaveRequests.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leave requests
            </h3>
            <p className="text-gray-500 mb-4">
              You haven't submitted any leave requests yet.
            </p>
            <Button onClick={() => setShowDialog(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Submit Your First Request</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">
                          {request.leave_type}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Duration:</span>
                          <p className="text-gray-600">
                            {calculateDays(request.start_date, request.end_date)} day(s)
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Start:</span>
                          <p className="text-gray-600">{format(new Date(request.start_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">End:</span>
                          <p className="text-gray-600">{format(new Date(request.end_date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      
                      {request.reason && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">Reason:</span>
                          <p className="text-gray-600 mt-1">{request.reason}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-500">
                        Submitted: {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <LeaveRequestDialog 
          open={showDialog} 
          onOpenChange={setShowDialog}
        />
      </CardContent>
    </Card>
  );
};

export default DriverLeaveRequests;
