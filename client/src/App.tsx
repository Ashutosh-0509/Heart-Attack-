import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import Home from "@/pages/Home";
import ScanSelect from "@/pages/ScanSelect";
import ActiveScan from "@/pages/ActiveScan";
import Results from "@/pages/Results";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import CvdPredictor from "@/pages/CvdPredictor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path={ROUTE_PATHS.HOME} element={<Home />} />
          <Route path={ROUTE_PATHS.SCAN_SELECT} element={<ScanSelect />} />
          <Route path={ROUTE_PATHS.ACTIVE_SCAN} element={<ActiveScan />} />
          <Route path={ROUTE_PATHS.RESULTS} element={<Results />} />
          <Route path={ROUTE_PATHS.HISTORY} element={<History />} />
          <Route path={ROUTE_PATHS.SETTINGS} element={<Settings />} />
          <Route path={ROUTE_PATHS.CVD_PREDICTOR} element={<CvdPredictor />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;