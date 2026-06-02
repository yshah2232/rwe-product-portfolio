import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WorldProvider } from "@/contexts/WorldContext";
import { PlainModeProvider } from "@/contexts/PlainModeContext";
import SiteLayout from "@/components/SiteLayout";
import AudienceModal from "@/components/AudienceModal";
import Index from "./pages/Index";
import About from "./pages/About";
import DataMethod from "./pages/DataMethod";
import SearchRegistry from "./pages/SearchRegistry";
import Cohorts from "./pages/Cohorts";
import CohortDetail from "./pages/CohortDetail";
import CohortDiversity from "./pages/CohortDiversity";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import MedicalDisclaimer from "./pages/MedicalDisclaimer";
import NotFound from "./pages/NotFound";
import HeatmapAnalytics from "./pages/HeatmapAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WorldProvider>
        <PlainModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AudienceModal />
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
              <Route path="/cohorts/:id/diversity" element={<CohortDiversity />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/medical-disclaimer" element={<MedicalDisclaimer />} />
              <Route path="/analytics/heatmap" element={<HeatmapAnalytics />} />
              {/* Deactivated legacy synthetic dashboards */}
              <Route path="/dashboard" element={<Navigate to="/search-registry" replace />} />
              <Route path="/journey-analytics" element={<Navigate to="/search-registry" replace />} />
              <Route path="/patient-journey" element={<Navigate to="/search-registry" replace />} />
            </Route>
            <Route path="/methodology" element={<Navigate to="/data-method" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </PlainModeProvider>
      </WorldProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
