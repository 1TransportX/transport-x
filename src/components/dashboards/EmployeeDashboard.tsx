
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Package, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { MobileStatusCard } from '@/components/ui/mobile-status-card';
import { ResponsiveHeader } from '@/components/ui/responsive-header';
import AddTaskDialog from '../tasks/AddTaskDialog';

const EmployeeDashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddTask, setShowAddTask] = useState(false);

  // Get today's date for consistent querying
  const today = new Date().toISOString().split('T')[0];

  // Fetch tasks assigned to the current user
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['employee-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching tasks for user:', user.id);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      console.log('Fetched tasks:', data);
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  // Fetch today's attendance - get the most recent record for today
  const { data: todayAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['today-attendance', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching attendance for date:', today);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', `${today}T00:00:00`)
        .lt('clock_in', `${today}T23:59:59`)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching attendance:', error);
        throw error;
      }
      console.log('Today attendance:', data);
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  // Mark task as complete mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      console.log('Completing task:', taskId);
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['employee-tasks'] });
      refetchTasks();
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed.",
      });
    },
    onError: (error) => {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete task.",
        variant: "destructive",
      });
    }
  });

  // Clock in/out mutation with proper validation
  const clockMutation = useMutation({
    mutationFn: async (action: 'clock_in' | 'clock_out') => {
      console.log('Clock action:', action);
      
      if (action === 'clock_in') {
        // Check if already clocked in today
        if (todayAttendance && !todayAttendance.clock_out) {
          throw new Error('You are already clocked in today');
        }

        const { data, error } = await supabase
          .from('attendance')
          .insert({
            user_id: user?.id,
            clock_in: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        console.log('Clocked in:', data);
        return data;
      } else {
        // Clock out
        if (!todayAttendance || todayAttendance.clock_out) {
          throw new Error('You must clock in first or you are already clocked out');
        }

        const { data, error } = await supabase
          .from('attendance')
          .update({
            clock_out: new Date().toISOString()
          })
          .eq('id', todayAttendance.id)
          .select()
          .single();
        
        if (error) throw error;
        console.log('Clocked out:', data);
        return data;
      }
    },
    onSuccess: () => {
      // Invalidate attendance queries
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      refetchAttendance();
      toast({
        title: "Success",
        description: "Attendance recorded successfully.",
      });
    },
    onError: (error) => {
      console.error('Clock error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance.",
        variant: "destructive",
      });
    }
  });

  // Calculate dashboard statistics
  const todayTasks = tasks.filter(task => {
    const taskDue = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null;
    return taskDue === today;
  });

  const completedCount = todayTasks.filter(task => task.status === 'completed').length;
  const priorityAlertsCount = tasks.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  ).length;

  const isWorking = todayAttendance && !todayAttendance.clock_out;
  const clockInTime = todayAttendance?.clock_in 
    ? new Date(todayAttendance.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    : null;

  if (tasksLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 mb-2 sm:mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Mobile-first header */}
      <ResponsiveHeader
        title="My Dashboard"
        subtitle="Track your tasks and attendance for today"
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => clockMutation.mutate(isWorking ? 'clock_out' : 'clock_in')}
            disabled={clockMutation.isPending}
            className={`w-full sm:w-auto ${isWorking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} h-10 sm:h-9`}
          >
            <Clock className="h-4 w-4 mr-2" />
            {clockMutation.isPending ? 'Processing...' : (isWorking ? 'Clock Out' : 'Clock In')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowAddTask(true)}
            className="w-full sm:w-auto h-10 sm:h-9"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </ResponsiveHeader>

      {/* Mobile-first status cards */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
        <MobileStatusCard
          title="Today's Status"
          value={isWorking ? 'Clocked In' : 'Not Working'}
          subtitle={clockInTime ? `Since ${clockInTime}` : 'Not clocked in today'}
          icon={Clock}
          iconColor={isWorking ? 'text-green-600' : 'text-gray-600'}
          valueColor={isWorking ? 'text-green-600' : 'text-gray-600'}
        />
        
        <MobileStatusCard
          title="Tasks Completed"
          value={`${completedCount} / ${todayTasks.length}`}
          subtitle={`${todayTasks.length - completedCount} remaining`}
          icon={CheckCircle}
          iconColor="text-blue-600"
          valueColor="text-blue-600"
        />
        
        <MobileStatusCard
          title="Priority Alerts"
          value={priorityAlertsCount}
          subtitle="Require attention"
          icon={AlertCircle}
          iconColor="text-orange-600"
          valueColor="text-orange-600"
          className="sm:col-span-2 lg:col-span-1"
        />
      </ResponsiveGrid>

      {/* Today's Tasks - Mobile optimized */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Package className="h-5 w-5 mr-2" />
            Today's Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {todayTasks.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-500 mb-4">No tasks due today</p>
              <Button 
                variant="outline" 
                onClick={() => setShowAddTask(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {todayTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`p-3 sm:p-4 rounded-lg border ${
                    task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${
                        task.status === 'completed' ? 'bg-green-500' : 
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm sm:text-base ${
                          task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                        } break-words`}>
                          {task.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Due: {task.due_date ? new Date(task.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No due time'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority}
                      </span>
                      {task.status !== 'completed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => completeTaskMutation.mutate(task.id)}
                          disabled={completeTaskMutation.isPending}
                          className="text-xs sm:text-sm"
                        >
                          {completeTaskMutation.isPending ? 'Saving...' : 'Complete'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Tasks Overview - Mobile optimized */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">All My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {tasks.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-500">No tasks assigned</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      } truncate`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {tasks.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  And {tasks.length - 5} more tasks...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddTaskDialog 
        open={showAddTask} 
        onOpenChange={setShowAddTask}
      />
    </div>
  );
};

export default EmployeeDashboard;
