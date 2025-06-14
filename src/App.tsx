
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employees" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold">Employee Management</h1>
                    <p className="text-gray-600 mt-2">Manage employee records, attendance, and assignments.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="fleet" element={
                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold">Fleet Management</h1>
                    <p className="text-gray-600 mt-2">Monitor vehicles, routes, and maintenance schedules.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="warehouse" element={
                <ProtectedRoute allowedRoles={['admin', 'employee']}>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold">Warehouse Management</h1>
                    <p className="text-gray-600 mt-2">Track inventory, manage stock levels, and monitor shipments.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-gray-600 mt-2">Configure system settings and user permissions.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute allowedRoles={['employee', 'driver']}>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    <p className="text-gray-600 mt-2">View and update your personal information.</p>
                  </div>
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
