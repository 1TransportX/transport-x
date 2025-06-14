
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Clock, CheckCircle, Navigation, Camera } from 'lucide-react';

const DriverDashboard = () => {
  const todayRoutes = [
    { 
      id: 1, 
      customer: 'ABC Corp', 
      address: '123 Business Ave, City', 
      time: '9:00 AM', 
      status: 'completed',
      packages: 3
    },
    { 
      id: 2, 
      customer: 'Tech Solutions Inc', 
      address: '456 Tech Park, Downtown', 
      time: '11:30 AM', 
      status: 'in-progress',
      packages: 5
    },
    { 
      id: 3, 
      customer: 'Retail Store XYZ', 
      address: '789 Shopping District', 
      time: '2:00 PM', 
      status: 'pending',
      packages: 2
    },
    { 
      id: 4, 
      customer: 'Manufacturing Ltd', 
      address: '321 Industrial Zone', 
      time: '4:30 PM', 
      status: 'pending',
      packages: 8
    }
  ];

  const vehicleInfo = {
    id: 'VH-007',
    model: 'Ford Transit',
    fuel: '75%',
    mileage: '24,567 km',
    nextMaintenance: '25,000 km'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-gray-600">Your routes and vehicle status for today</p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Navigation className="h-4 w-4 mr-2" />
            Start Navigation
          </Button>
          <Button variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Upload Proof
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">1</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">1</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vehicle Fuel</p>
                <p className="text-2xl font-bold text-blue-600">{vehicleInfo.fuel}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Today's Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayRoutes.map((route) => (
              <div 
                key={route.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  route.status === 'completed' ? 'bg-green-50 border-green-200' :
                  route.status === 'in-progress' ? 'bg-blue-50 border-blue-200' :
                  'bg-white border-gray-200'
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    route.status === 'completed' ? 'bg-green-500' :
                    route.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {route.id}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{route.customer}</p>
                    <p className="text-sm text-gray-600">{route.address}</p>
                    <p className="text-sm text-gray-500">{route.time} • {route.packages} packages</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    route.status === 'completed' ? 'bg-green-100 text-green-800' :
                    route.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {route.status}
                  </span>
                  {route.status === 'in-progress' && (
                    <Button size="sm">
                      Complete Delivery
                    </Button>
                  )}
                  {route.status === 'pending' && (
                    <Button size="sm" variant="outline">
                      Start Route
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Vehicle Information - {vehicleInfo.id}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Model</p>
              <p className="font-medium">{vehicleInfo.model}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Fuel Level</p>
              <p className="font-medium text-green-600">{vehicleInfo.fuel}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Mileage</p>
              <p className="font-medium">{vehicleInfo.mileage}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Next Service</p>
              <p className="font-medium text-orange-600">{vehicleInfo.nextMaintenance}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;
