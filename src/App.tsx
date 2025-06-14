
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
import EmployeeList from "./components/employees/EmployeeList";
import FleetManagement from "./components/fleet/FleetManagement";
import WarehouseManagement from "./components/warehouse/WarehouseManagement";
import SettingsPage from "./components/settings/SettingsPage";
import ReportsPage from "./components/reports/ReportsPage";
import ProfilePage from "./components/profile/ProfilePage";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="employees" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <EmployeeList />
                  </ProtectedRoute>
                } />
                <Route path="fleet" element={
                  <ProtectedRoute allowedRoles={['admin', 'driver']}>
                    <FleetManagement />
                  </ProtectedRoute>
                } />
                <Route path="warehouse" element={
                  <ProtectedRoute allowedRoles={['admin', 'employee']}>
                    <WarehouseManagement />
                  </ProtectedRoute>
                } />
                <Route path="reports" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute allowedRoles={['employee', 'driver', 'admin']}>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
