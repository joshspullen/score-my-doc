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
import Settings from "./pages/Settings.tsx";
import Teams from "./pages/Teams.tsx";
import Connectors from "./pages/Connectors.tsx";
import DataCatalog from "./pages/DataCatalog.tsx";
import Profile from "./pages/Profile.tsx";
import People from "./pages/People.tsx";
import Training from "./pages/Training.tsx";
import Compliance from "./pages/Compliance.tsx";
import BusinessProcesses from "./pages/BusinessProcesses.tsx";
import Knowledge from "./pages/Knowledge.tsx";
import Agents from "./pages/Agents.tsx";
import PeopleOps from "./pages/PeopleOps.tsx";
import Decisions from "./pages/telemetry/Decisions.tsx";
import TraceExplorer from "./pages/telemetry/TraceExplorer.tsx";
import Outcomes from "./pages/telemetry/Outcomes.tsx";
import PlatformKnowledge from "./pages/marketing/PlatformKnowledge.tsx";
import PlatformIntegrations from "./pages/marketing/PlatformIntegrations.tsx";
import PlatformAgents from "./pages/marketing/PlatformAgents.tsx";
import PlatformPeopleOps from "./pages/marketing/PlatformPeopleOps.tsx";
import Resources from "./pages/marketing/Resources.tsx";
import Blog from "./pages/marketing/Blog.tsx";
import BlogPost from "./pages/marketing/BlogPost.tsx";
import Customers from "./pages/marketing/Customers.tsx";
import Changelog from "./pages/marketing/Changelog.tsx";
import RegulatoryLibrary from "./pages/marketing/RegulatoryLibrary.tsx";
import Brand from "./pages/marketing/Brand.tsx";
import TechStack from "./pages/marketing/TechStack.tsx";
import Company from "./pages/marketing/Company.tsx";
import Team from "./pages/marketing/Team.tsx";
import Pricing from "./pages/marketing/Pricing.tsx";
import Contact from "./pages/marketing/Contact.tsx";
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
            {/* Marketing routes */}
            <Route path="/platform/knowledge" element={<PlatformKnowledge />} />
            <Route path="/platform/integrations" element={<PlatformIntegrations />} />
            <Route path="/platform/agents" element={<PlatformAgents />} />
            <Route path="/platform/people-ops" element={<PlatformPeopleOps />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/blog" element={<Blog />} />
            <Route path="/resources/blog/:slug" element={<BlogPost />} />
            <Route path="/resources/customers" element={<Customers />} />
            <Route path="/resources/changelog" element={<Changelog />} />
            <Route path="/resources/regulatory-library" element={<RegulatoryLibrary />} />
            <Route path="/resources/brand" element={<Brand />} />
            <Route path="/resources/tech-stack" element={<TechStack />} />
            <Route path="/company" element={<Company />} />
            <Route path="/team" element={<Team />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><AppShell><Upload /></AppShell></ProtectedRoute>} />
            <Route path="/results/:id" element={<ProtectedRoute><AppShell><Results /></AppShell></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AppShell><Admin /></AppShell></AdminRoute>} />
            <Route path="/settings" element={<AdminRoute><AppShell><Settings /></AppShell></AdminRoute>} />
            <Route path="/teams" element={<ProtectedRoute><AppShell><Teams /></AppShell></ProtectedRoute>} />
            <Route path="/connectors" element={<AdminRoute><AppShell><Connectors /></AppShell></AdminRoute>} />
            <Route path="/catalog" element={<ProtectedRoute><AppShell><DataCatalog /></AppShell></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />
            <Route path="/people" element={<ProtectedRoute><AppShell><People /></AppShell></ProtectedRoute>} />
            <Route path="/people/users" element={<AdminRoute><AppShell><Admin /></AppShell></AdminRoute>} />
            <Route path="/people/teams" element={<ProtectedRoute><AppShell><Teams /></AppShell></ProtectedRoute>} />
            <Route path="/people/ops" element={<ProtectedRoute><AppShell><PeopleOps /></AppShell></ProtectedRoute>} />
            <Route path="/knowledge" element={<ProtectedRoute><AppShell><Knowledge /></AppShell></ProtectedRoute>} />
            <Route path="/knowledge/regulations" element={<ProtectedRoute><AppShell><Compliance /></AppShell></ProtectedRoute>} />
            <Route path="/knowledge/processes" element={<ProtectedRoute><AppShell><BusinessProcesses /></AppShell></ProtectedRoute>} />
            <Route path="/knowledge/training" element={<ProtectedRoute><AppShell><Training /></AppShell></ProtectedRoute>} />
            <Route path="/agents" element={<AdminRoute><AppShell><Agents /></AppShell></AdminRoute>} />
            <Route path="/telemetry" element={<ProtectedRoute><AppShell><Decisions /></AppShell></ProtectedRoute>} />
            <Route path="/telemetry/traces" element={<ProtectedRoute><AppShell><TraceExplorer /></AppShell></ProtectedRoute>} />
            <Route path="/telemetry/outcomes" element={<ProtectedRoute><AppShell><Outcomes /></AppShell></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
