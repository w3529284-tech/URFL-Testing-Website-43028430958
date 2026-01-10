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
  ];

  const secondaryItems = [
    { path: "/previous-weeks", label: "Archives", icon: Clock },
    { path: "/update-planner", label: "Planner", icon: Clock },
    { path: "/partners", label: "Partners", icon: Users },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/60 backdrop-blur-2xl border-b border-border/40 z-[100] transition-all duration-300">
      <div className="max-w-screen-2xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Logo Section */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-all duration-500" />
              <Zap className="relative w-7 h-7 text-primary fill-primary/10 transition-transform group-hover:scale-110 duration-300" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors uppercase italic leading-none">URFL</h1>
            </div>
          </div>
        </Link>

        {/* Main Navigation - Desktop Only */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`h-9 px-4 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Actions Section */}
        <div className="flex items-center gap-2">
          {/* Secondary Nav Dropdown */}
          <div className="hidden sm:flex items-center gap-2 mr-2 pr-2 border-r border-border/40">
            {secondaryItems.slice(0, 2).map((item) => (
              <Link key={item.path} href={item.path}>
                <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl">
                  <item.icon className="w-4 h-4" />
                </Button>
              </Link>
            ))}
          </div>

          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="outline"
                className={`h-9 px-4 font-black uppercase tracking-widest text-[9px] rounded-xl border-accent/20 text-accent hover:bg-accent/5 ${
                  location === '/admin' ? 'bg-accent/10 border-accent/40' : ''
                }`}
              >
                <Shield className="w-3.5 h-3.5 mr-2" />
                Admin
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
              <a href="/api/logout">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </a>
            </div>
          ) : (
            <a href="/login">
              <Button
                className="h-9 px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
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
    <nav className="fixed bottom-4 left-4 right-4 h-16 bg-background/80 backdrop-blur-2xl border border-border/40 rounded-2xl z-[100] lg:hidden shadow-2xl overflow-hidden">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
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
