import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, Zap, Calendar, Trophy, BarChart3, Newspaper, Target, 
  Users, BookOpen, Shield, Moon, Sun, LogOut, LogIn, Settings,
  Snowflake, ChevronLeft, ChevronRight, Star, Clock
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
  const { isDark, toggleTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebar();
  const isAdmin = isAuthenticated && (user as any)?.role === "admin";

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/scores", label: "Live Scores", icon: Zap },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/playoffs", label: "Playoffs", icon: Trophy },
    { path: "/standings", label: "Standings", icon: BarChart3 },
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
        className={`fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground z-50 transition-all duration-300 ease-in-out hidden md:flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="relative p-4 border-b border-sidebar-border">
          <Link href="/">
            <div className={`flex items-center gap-3 cursor-pointer group ${collapsed ? 'justify-center' : ''}`}>
              <div className="relative">
                <Zap className="w-8 h-8 text-sidebar-primary" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-black tracking-tight group-hover:text-accent transition-colors">URFL</h1>
                  <p className="text-xs text-white/60 font-medium">Fan Hub</p>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 relative">
          <div className={`mb-4 ${collapsed ? 'px-1' : 'px-2'}`}>
            {!collapsed && (
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Navigation</p>
            )}
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center px-2' : 'justify-start px-3'
                    } ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary hover:text-primary-foreground' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
                    {!collapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {isAdmin && (
            <div className={`mt-6 ${collapsed ? 'px-1' : 'px-2'}`}>
              {!collapsed && (
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Admin</p>
              )}
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className={`w-full font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center px-2' : 'justify-start px-3'
                  } ${
                    location === '/admin'
                      ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/30 hover:bg-accent hover:text-accent-foreground'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  title={collapsed ? 'Admin Dashboard' : undefined}
                >
                  <Shield className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  {!collapsed && <span>Admin Dashboard</span>}
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="relative p-3 border-t border-white/10 space-y-2">
          {isAuthenticated ? (
            <a href="/api/logout">
              <Button
                variant="ghost"
                className={`w-full text-white/80 hover:text-white hover:bg-white/10 ${
                  collapsed ? 'justify-center px-2' : 'justify-start px-3'
                }`}
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && <span>Logout</span>}
              </Button>
            </a>
          ) : (
            <a href="/login">
              <Button
                variant="ghost"
                className={`w-full text-white/80 hover:text-white hover:bg-white/10 ${
                  collapsed ? 'justify-center px-2' : 'justify-start px-3'
                }`}
                title={collapsed ? 'Admin Login' : undefined}
              >
                <LogIn className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && <span>Login</span>}
              </Button>
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full text-white/60 hover:text-white hover:bg-white/10 mt-2"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
      </aside>
      <MobileNav navItems={navItems} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
    </>
  );
}

function MobileNav({ navItems, isAuthenticated, isAdmin }: { navItems: Array<{ path: string; label: string; icon: any }>; isAuthenticated: boolean; isAdmin: boolean }) {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-secondary/95 backdrop-blur-lg border-t border-white/10 z-50 md:hidden safe-area-bottom">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center h-16 px-2 gap-1 min-w-min">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all flex-shrink-0 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
                </button>
              </Link>
            );
          })}
          {isAdmin && (
            <Link href="/admin">
              <button
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all flex-shrink-0 ${
                  location === '/admin'
                    ? 'bg-accent text-accent-foreground shadow-lg' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Admin Dashboard"
              >
                <Shield className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-medium">Admin</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
