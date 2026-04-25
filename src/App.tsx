import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Upload from "./pages/Upload.tsx";
import Results from "./pages/Results.tsx";
import Admin from "./pages/Admin.tsx";
import Teams from "./pages/Teams.tsx";
import Connectors from "./pages/Connectors.tsx";
import Profile from "./pages/Profile.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AdminRoute } from "./components/AdminRoute.tsx";
import { AppShell } from "./components/AppShell.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><AppShell><Upload /></AppShell></ProtectedRoute>} />
            <Route path="/results/:id" element={<ProtectedRoute><AppShell><Results /></AppShell></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AppShell><Admin /></AppShell></AdminRoute>} />
            <Route path="/teams" element={<ProtectedRoute><AppShell><Teams /></AppShell></ProtectedRoute>} />
            <Route path="/connectors" element={<AdminRoute><AppShell><Connectors /></AppShell></AdminRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
