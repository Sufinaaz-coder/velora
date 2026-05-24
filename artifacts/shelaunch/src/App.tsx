import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import BusinessLaunch from "@/pages/launch";
import CampaignGenerator from "@/pages/campaign";
import Assistant from "@/pages/assistant";
import History from "@/pages/history";
import Trending from "@/pages/trending";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/launch" component={BusinessLaunch} />
      <Route path="/campaign" component={CampaignGenerator} />
      <Route path="/assistant" component={Assistant} />
      <Route path="/history" component={History} />
      <Route path="/trending" component={Trending} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
