import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorldProvider } from "@/contexts/WorldContext";
import SiteLayout from "@/components/SiteLayout";
import Index from "./pages/Index";
import Modules from "./pages/Modules";
import Method from "./pages/Method";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import DataDictionary from "./pages/DataDictionary";
import JourneyAnalytics from "./pages/JourneyAnalytics";
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
              <Route path="/modules" element={<Modules />} />
              <Route path="/method" element={<Method />} />
              <Route path="/about" element={<About />} />
              <Route path="/data-dictionary" element={<DataDictionary />} />
            </Route>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/journey-analytics" element={<JourneyAnalytics />} />
            <Route path="/methodology" element={<Method />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WorldProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
