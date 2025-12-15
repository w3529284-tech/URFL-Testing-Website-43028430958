import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, SidebarProvider, useSidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "@/pages/Landing";
import LiveScores from "@/pages/LiveScores";
import GameDetail from "@/pages/GameDetail";
import PreviousWeeks from "@/pages/PreviousWeeks";
import Schedule from "@/pages/Schedule";
import Playoffs from "@/pages/Playoffs";
import Standings from "@/pages/Standings";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import Pickems from "@/pages/Pickems";
import Partners from "@/pages/Partners";
import UserSettings from "@/pages/UserSettings";
import AdminDashboard from "@/pages/AdminDashboard";
import SocialLinks from "@/pages/SocialLinks";
import Changelogs from "@/pages/Changelogs";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useNotifications } from "@/hooks/useNotifications";

function ChristmasDecorations() {
  const preferences = useUserPreferences();
  const particlePercentage = preferences.particleEffects ?? 100;
  const reduceAnimations = preferences.reduceAnimations ?? false;
  
  // Don't render snowflakes if animations are reduced
  if (reduceAnimations) {
    return null;
  }
  
  const snowflakes = useMemo(() => {
    const count = Math.round((25 * particlePercentage) / 100);
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 10 + 8,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 15,
      opacity: Math.random() * 0.3 + 0.2,
    }));
  }, [particlePercentage]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            opacity: flake.opacity,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}

function MainContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { collapsed } = useSidebar();
  const [location, setLocation] = useLocation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const preferences = useUserPreferences();
  useNotifications();

  const { data: maintenanceStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/settings/maintenance-mode"],
  });

  const isAdmin = isAuthenticated && (user as any)?.role === "admin";

  useEffect(() => {
    if (maintenanceStatus?.enabled) {
      setMaintenanceMode(true);
      // Redirect non-home pages to home when maintenance mode is on (unless user is admin)
      if (!isAdmin && location !== "/" && location !== "/login") {
        setLocation("/");
      }
    } else {
      setMaintenanceMode(false);
    }
  }, [maintenanceStatus, location, setLocation, isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎄</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const showSidebar = !maintenanceMode || isAdmin;

  return (
    <div className={`min-h-screen bg-background ${preferences.reduceAnimations ? 'reduce-motion' : ''}`}>
      <ChristmasDecorations />
      {showSidebar && <Sidebar />}
      
      <main className={`min-h-screen pb-20 md:pb-0 ${preferences.reduceAnimations ? '' : 'transition-all duration-300'} ${
        showSidebar && !collapsed ? 'md:ml-64' : showSidebar && collapsed ? 'md:ml-20' : ''
      }`}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          {(!maintenanceMode || isAdmin) && (
            <>
              <Route path="/scores" component={LiveScores} />
              <Route path="/game/:id" component={GameDetail} />
              <Route path="/previous-weeks" component={PreviousWeeks} />
              <Route path="/schedule" component={Schedule} />
              <Route path="/playoffs" component={Playoffs} />
              <Route path="/standings" component={Standings} />
              <Route path="/news" component={News} />
              <Route path="/news/:id" component={NewsDetail} />
              <Route path="/pickems" component={Pickems} />
              <Route path="/partners" component={Partners} />
              <Route path="/settings" component={UserSettings} />
              <Route path="/social" component={SocialLinks} />
              <Route path="/changelogs" component={Changelogs} />
            </>
          )}
          {isAdmin && <Route path="/admin" component={AdminDashboard} />}
          {(!maintenanceMode || isAdmin) && <Route component={NotFound} />}
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <MainContent />
          </TooltipProvider>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
