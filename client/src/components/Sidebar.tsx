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

  const secondaryItems = [
    { path: "/partners", label: "Partners", icon: Users },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-background/60 backdrop-blur-2xl border-r border-border/40 z-[100] hidden lg:flex flex-col transition-all duration-300">
        <div className="p-6 flex flex-col h-full gap-8">
          {/* Logo Section */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-all duration-500" />
                <Zap className="relative w-7 h-7 text-primary fill-primary/10 transition-transform group-hover:scale-110 duration-300" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors uppercase italic leading-none">URFL</h1>
              </div>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-1 flex-1">
            {[...navItems, ...secondaryItems].map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-10 px-4 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions Section */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className={`w-full justify-start h-10 px-4 font-black uppercase tracking-widest text-[9px] rounded-xl border-accent/20 text-accent hover:bg-accent/5 ${
                    location === '/admin' ? 'bg-accent/10 border-accent/40' : ''
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 mr-3" />
                  Admin
                </Button>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link href="/settings">
                  <Button variant="ghost" className="w-full justify-start h-10 px-4 rounded-xl hover:bg-white/5 text-muted-foreground">
                    <Settings className="w-4 h-4 mr-3" />
                    <span className="font-black uppercase tracking-widest text-[10px]">Settings</span>
                  </Button>
                </Link>
                <a href="/api/logout">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="font-black uppercase tracking-widest text-[10px]">Logout</span>
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/login" className="w-full">
                <Button
                  className="w-full h-10 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  Login
                </Button>
              </a>
            )}
          </div>
        </div>
      </aside>
      <MobileNav navItems={navItems} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
    </>
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
