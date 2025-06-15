import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Package, Calendar, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddTaskDialog from '../tasks/AddTaskDialog';

const EmployeeDashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddTask, setShowAddTask] = useState(false);

  // Fetch tasks assigned to the current user
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['employee-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch attendance status for today
  const { data: todayAttendance } = useQuery({
    queryKey: ['today-attendance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', `${today}T00:00:00`)
        .lt('clock_in', `${today}T23:59:59`)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  // Mark task as complete mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
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
      queryClient.invalidateQueries({ queryKey: ['employee-tasks'] });
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task.",
        variant: "destructive",
      });
    }
  });

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async (action: 'clock_in' | 'clock_out') => {
      if (action === 'clock_in') {
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            user_id: user?.id,
            clock_in: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .update({
            clock_out: new Date().toISOString()
          })
          .eq('id', todayAttendance?.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      toast({
        title: "Success",
        description: "Attendance recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance.",
        variant: "destructive",
      });
    }
  });

  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    const taskDue = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null;
    return taskDue === today;
  });

  const completedCount = todayTasks.filter(task => task.status === 'completed').length;
  const priorityAlertsCount = tasks.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  ).length;

  const isWorking = todayAttendance && !todayAttendance.clock_out;

  if (tasksLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Track your tasks and attendance for today</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => clockMutation.mutate(isWorking ? 'clock_out' : 'clock_in')}
            disabled={clockMutation.isPending}
            className={isWorking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            <Clock className="h-4 w-4 mr-2" />
            {isWorking ? 'Clock Out' : 'Clock In'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowAddTask(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Status Cards - Updated to 2x2 grid on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Today's Status</p>
                <p className={`text-lg md:text-2xl font-bold ${isWorking ? 'text-green-600' : 'text-gray-600'}`}>
                  {isWorking ? 'Clocked In' : 'Not Working'}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  {todayAttendance?.clock_in 
                    ? `Since ${new Date(todayAttendance.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                    : 'Not clocked in today'
                  }
                </p>
              </div>
              <Clock className={`h-6 w-6 md:h-8 md:w-8 ${isWorking ? 'text-green-600' : 'text-gray-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Tasks Completed</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">{completedCount} / {todayTasks.length}</p>
                <p className="text-xs md:text-sm text-gray-500">{todayTasks.length - completedCount} remaining</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Priority Alerts</p>
                <p className="text-lg md:text-2xl font-bold text-orange-600">{priorityAlertsCount}</p>
                <p className="text-xs md:text-sm text-gray-500">Require attention</p>
              </div>
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Today's Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks due today</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowAddTask(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' : 
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No due time'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Tasks Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {tasks.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
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
