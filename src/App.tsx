import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SecurityProvider } from "@/contexts/SecurityContext";
import SecurityHeaders from "@/components/security/SecurityHeaders";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeList from "./components/employees/EmployeeList";
import RoutesPage from "./components/routes/RoutesPage";
import FleetPage from "./components/fleet/FleetPage";
import SettingsPage from "./components/settings/SettingsPage";
import ProfilePage from "./components/profile/ProfilePage";
import DriversPage from "./components/drivers/DriversPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SecurityHeaders />
        <Toaster />
        <Sonner />
        <AuthProvider>
          <SecurityProvider>
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
                  <Route path="drivers" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DriversPage />
                    </ProtectedRoute>
                  } />
                  <Route path="routes" element={
                    <ProtectedRoute allowedRoles={['admin', 'driver']}>
                      <RoutesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="fleet" element={
                    <ProtectedRoute allowedRoles={['admin', 'driver']}>
                      <FleetPage />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={
                    <ProtectedRoute allowedRoles={['admin', 'driver']}>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </SecurityProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
