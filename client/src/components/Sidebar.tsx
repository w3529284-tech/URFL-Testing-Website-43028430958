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
  const { collapsed, setCollapsed } = useSidebar();
  const isAdmin = isAuthenticated && (user as any)?.role === "admin";

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/scores", label: "Live Scores", icon: Zap },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/playoffs", label: "Playoffs", icon: Trophy },
    { path: "/standings", label: "Standings", icon: BarChart3 },
    { path: "/stats", label: "Stats & Data", icon: BarChart3 },
    { path: "/teams", label: "Teams", icon: Shirt },
    { path: "/previous-weeks", label: "Archives", icon: Calendar },
    { path: "/news", label: "News", icon: Newspaper },
    { path: "/betting", label: "Betting", icon: Target },
    { path: "/update-planner", label: "Update Planner", icon: Clock },
    { path: "/partners", label: "Partners", icon: Users },
    { path: "/social", label: "Social", icon: Users },
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/changelogs", label: "Updates", icon: BookOpen },
  ];

  return (
    <>
      <aside 
        className={`fixed left-0 top-0 h-full bg-card/50 backdrop-blur-xl text-sidebar-foreground z-50 border-r border-border/50 transition-all duration-300 ease-in-out hidden md:flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="relative p-6">
          <Link href="/">
            <div className={`flex items-center gap-3 cursor-pointer group ${collapsed ? 'justify-center' : ''}`}>
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 blur rounded-full group-hover:bg-primary/30 transition-all" />
                <Zap className="relative w-8 h-8 text-primary fill-primary/10" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors uppercase italic leading-none">URFL</h1>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">Fan Hub</p>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full font-bold uppercase tracking-wide text-[11px] transition-all duration-200 ${
                      collapsed ? 'justify-center px-0' : 'justify-start px-4'
                    } ${
                      isActive 
                        ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-none' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${collapsed ? '' : 'mr-4'} flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {isAdmin && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-4">Admin Control</p>
              )}
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className={`w-full font-bold uppercase tracking-wide text-[11px] transition-all duration-200 ${
                    collapsed ? 'justify-center px-0' : 'justify-start px-4'
                  } ${
                    location === '/admin'
                      ? 'bg-accent/10 text-accent border-r-2 border-accent rounded-none'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Shield className={`w-4 h-4 ${collapsed ? '' : 'mr-4'} flex-shrink-0`} />
                  {!collapsed && <span>Admin Dashboard</span>}
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="relative p-4 border-t border-border/50 space-y-2 bg-card/30">
          {isAuthenticated ? (
            <a href="/api/logout">
              <Button
                variant="ghost"
                className={`w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold uppercase tracking-wide text-[11px] ${
                  collapsed ? 'justify-center px-0' : 'justify-start px-4'
                }`}
              >
                <LogOut className={`w-4 h-4 ${collapsed ? '' : 'mr-4'}`} />
                {!collapsed && <span>Logout</span>}
              </Button>
            </a>
          ) : (
            <a href="/login">
              <Button
                variant="ghost"
                className={`w-full text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold uppercase tracking-wide text-[11px] ${
                  collapsed ? 'justify-center px-0' : 'justify-start px-4'
                }`}
              >
                <LogIn className={`w-4 h-4 ${collapsed ? '' : 'mr-4'}`} />
                {!collapsed && <span>Login</span>}
              </Button>
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest">Collapse</span>}
          </Button>
        </div>
      </aside>
      <MobileNav navItems={navItems} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
    </>
  );
}

function MobileNav({ navItems, isAuthenticated, isAdmin }: { navItems: Array<{ path: string; label: string; icon: any }>; isAuthenticated: boolean; isAdmin: boolean }) {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 z-50 md:hidden safe-area-bottom">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center h-16 px-4 gap-2 min-w-min">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all flex-shrink-0 ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[9px] mt-1 font-black uppercase tracking-tighter leading-none">{item.label.split(' ')[0]}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
