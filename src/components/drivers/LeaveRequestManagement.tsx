
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Check, X, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

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
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const LeaveRequestManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeaveRequest[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast({
        title: "Success",
        description: `Leave request ${status} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update leave request",
        variant: "destructive"
      });
    }
  });

  const handleApprove = (requestId: string) => {
    updateStatusMutation.mutate({ requestId, status: 'approved' });
  };

  const handleReject = (requestId: string) => {
    updateStatusMutation.mutate({ requestId, status: 'rejected' });
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (selectedStatus === 'all') return true;
    return request.status === selectedStatus;
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Leave Request Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({leaveRequests.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({leaveRequests.filter(r => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({leaveRequests.filter(r => r.status === 'approved').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({leaveRequests.filter(r => r.status === 'rejected').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="mt-6">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No leave requests found
                  </h3>
                  <p className="text-gray-500">
                    {selectedStatus === 'all' ? 'No leave requests have been submitted yet.' : `No ${selectedStatus} leave requests.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {request.profiles.first_name} {request.profiles.last_name}
                              </span>
                              <span className="text-sm text-gray-500">({request.profiles.email})</span>
                              {getStatusBadge(request.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Leave Type:</span>
                                <p className="text-gray-600">{request.leave_type}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Duration:</span>
                                <p className="text-gray-600">
                                  {calculateDays(request.start_date, request.end_date)} day(s)
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Start Date:</span>
                                <p className="text-gray-600">{format(new Date(request.start_date), 'MMM dd, yyyy')}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">End Date:</span>
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
                          
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                disabled={updateStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveRequestManagement;
