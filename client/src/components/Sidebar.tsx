import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, Zap, Calendar, Trophy, BarChart3, Newspaper, Target, 
  Users, BookOpen, Shield, LogOut, LogIn, Settings,
  ChevronLeft, ChevronRight, Clock, Shirt
} from "lucide-react";
import { createContext, useContext, useState, ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return { collapsed: false, setCollapsed: () => {} };
  }
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && (user as any)?.role === "admin";

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/scores", label: "Scores", icon: Zap },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/playoffs", label: "Playoffs", icon: Trophy },
    { path: "/standings", label: "Standings", icon: BarChart3 },
    { path: "/teams", label: "Teams", icon: Shirt },
    { path: "/news", label: "News", icon: Newspaper },
    { path: "/betting", label: "Betting", icon: Target },
    { path: "/previous-weeks", label: "Archives", icon: Clock },
    { path: "/update-planner", label: "Planner", icon: Clock },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 z-[100]">
      <div className="h-full px-6 flex items-center gap-8">
        {/* Logo Section */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="p-1.5 bg-primary rounded-lg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase italic">URFL</h1>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`h-9 px-4 font-bold uppercase tracking-wider text-[11px] rounded-lg transition-all ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Actions Section */}
        <div className="flex items-center gap-3 ml-auto">
          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="font-bold uppercase tracking-wider text-[10px] border-primary/20 hover:bg-primary/5"
              >
                <Shield className="w-3.5 h-3.5 mr-2" />
                Admin
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
              <a href="/api/logout">
                <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-destructive rounded-lg">
                  <LogOut className="w-4 h-4" />
                </Button>
              </a>
            </div>
          ) : (
            <a href="/login">
              <Button className="h-9 px-6 font-bold uppercase tracking-wider text-[11px] rounded-lg shadow-lg shadow-primary/20">
                Login
              </Button>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileNav({ navItems, isAuthenticated, isAdmin }: { navItems: Array<{ path: string; label: string; icon: any }>; isAuthenticated: boolean; isAdmin: boolean }) {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-4 left-4 right-4 h-16 bg-background/90 backdrop-blur-2xl border border-border/40 rounded-2xl z-[100] lg:hidden shadow-2xl overflow-hidden pointer-events-auto">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path} className="flex-1 h-full">
              <button
                className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
                <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
