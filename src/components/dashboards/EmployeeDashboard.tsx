
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Package, Calendar } from 'lucide-react';

const EmployeeDashboard = () => {
  const todayTasks = [
    { id: 1, title: 'Inventory Count - Section A', priority: 'high', completed: false, dueTime: '10:00 AM' },
    { id: 2, title: 'Package Sorting - Express Orders', priority: 'medium', completed: true, dueTime: '11:30 AM' },
    { id: 3, title: 'Quality Check - Batch #445', priority: 'low', completed: false, dueTime: '2:00 PM' },
    { id: 4, title: 'Stock Replenishment - Aisle 7', priority: 'medium', completed: false, dueTime: '4:00 PM' }
  ];

  const recentActivity = [
    { action: 'Completed inventory count', time: '2 hours ago' },
    { action: 'Clocked in for shift', time: '6 hours ago' },
    { action: 'Submitted quality report', time: '1 day ago' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Track your tasks and attendance for today</p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-green-600 hover:bg-green-700">
            <Clock className="h-4 w-4 mr-2" />
            Clock In
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Status</p>
                <p className="text-2xl font-bold text-green-600">Clocked In</p>
                <p className="text-sm text-gray-500">Since 8:00 AM</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                <p className="text-2xl font-bold text-blue-600">1 / 4</p>
                <p className="text-sm text-gray-500">3 remaining</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Priority Alerts</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
                <p className="text-sm text-gray-500">Require attention</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
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
          <div className="space-y-4">
            {todayTasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${
                    task.completed ? 'bg-green-500' : 
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-500">Due: {task.dueTime}</p>
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
                  {!task.completed && (
                    <Button size="sm" variant="outline">
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
