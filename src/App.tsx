import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WorldProvider } from "@/contexts/WorldContext";
import SiteLayout from "@/components/SiteLayout";
import Index from "./pages/Index";
import About from "./pages/About";
import DataMethod from "./pages/DataMethod";
import SearchRegistry from "./pages/SearchRegistry";
import Cohorts from "./pages/Cohorts";
import CohortDetail from "./pages/CohortDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WorldProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/data-method" element={<DataMethod />} />
              {/* Method + Data merged into Data & Method */}
              <Route path="/method" element={<Navigate to="/data-method" replace />} />
              <Route path="/data-dictionary" element={<Navigate to="/data-method" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/clinical-trials" element={<Navigate to="/search-registry" replace />} />
              <Route path="/search-registry" element={<SearchRegistry />} />
              <Route path="/cohorts" element={<Cohorts />} />
              <Route path="/cohorts/:id" element={<CohortDetail />} />
              {/* Deactivated legacy synthetic dashboards */}
              <Route path="/dashboard" element={<Navigate to="/search-registry" replace />} />
              <Route path="/journey-analytics" element={<Navigate to="/search-registry" replace />} />
              <Route path="/patient-journey" element={<Navigate to="/search-registry" replace />} />
            </Route>
            <Route path="/methodology" element={<Navigate to="/data-method" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WorldProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
