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
import AdminDashboard from "@/pages/AdminDashboard";
import SocialLinks from "@/pages/SocialLinks";
import Changelogs from "@/pages/Changelogs";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

function ChristmasDecorations() {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 10 + 8,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 15,
      opacity: Math.random() * 0.3 + 0.2,
    }));
  }, []);

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

  const { data: maintenanceStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/settings/maintenance-mode"],
  });

  useEffect(() => {
    if (maintenanceStatus?.enabled) {
      setMaintenanceMode(true);
      // Redirect non-home pages to home when maintenance mode is on
      if (location !== "/" && location !== "/login") {
        setLocation("/");
      }
    } else {
      setMaintenanceMode(false);
    }
  }, [maintenanceStatus, location, setLocation]);

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

  const isAdmin = isAuthenticated && (user as any)?.role === "admin";
  const showSidebar = !maintenanceMode || isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <ChristmasDecorations />
      {showSidebar && <Sidebar />}
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${
        showSidebar && !collapsed ? 'md:ml-64' : showSidebar && collapsed ? 'md:ml-20' : ''
      }`}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          {!maintenanceMode && (
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
              <Route path="/social" component={SocialLinks} />
              <Route path="/changelogs" component={Changelogs} />
            </>
          )}
          {isAdmin && <Route path="/admin" component={AdminDashboard} />}
          {!maintenanceMode && <Route component={NotFound} />}
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
