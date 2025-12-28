import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GameCard } from "@/components/GameCard";
import type { Game, News as NewsType } from "@shared/schema";
import { useLocation, Link } from "wouter";
import { ArrowRight, Trophy, Newspaper, Zap, Calendar, BarChart3, Target, Sparkles, Wrench } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { SiteTour } from "@/components/SiteTour";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/current"],
  });

  const { data: news, isLoading: newsLoading } = useQuery<NewsType[]>({
    queryKey: ["/api/news"],
  });

  const { data: maintenanceStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/settings/maintenance-mode"],
  });

  const isAdmin = isAuthenticated && (user as any)?.role === "admin";
  const currentWeek = games && games.length > 0 ? games[0].week : 1;
  const featuredNews = news?.slice(0, 2) || [];
  const liveGames = games?.filter(g => g.isLive) || [];
  const upcomingGames = games?.filter(g => !g.isLive && !g.isFinal)?.slice(0, 3) || [];
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Explicitly check for false to avoid issues with undefined/null during loading
    if (isAuthenticated && user && (user as any).hasCompletedTour === false) {
      setShowTour(true);
    } else {
      setShowTour(false);
    }
  }, [isAuthenticated, user]);

  if (maintenanceStatus?.enabled && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <Card className="max-w-md w-full p-8 border-2 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex flex-col items-center text-center space-y-4">
            <Wrench className="w-16 h-16 text-yellow-600" />
            <h1 className="text-3xl font-bold text-yellow-900">Under Maintenance</h1>
            <p className="text-yellow-800">We're currently updating the website. Please check back soon!</p>
          </div>
        </Card>
        
        <div className="fixed bottom-4 right-4">
          <Button 
            onClick={() => setLocation("/login")}
            className="shadow-lg"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {maintenanceStatus?.enabled && isAdmin && (
        <div className="mb-6 p-4 bg-muted border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Website Under Maintenance</h3>
              <p className="text-sm text-muted-foreground">We're currently updating the website. Please check back soon!</p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚡</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Welcome to URFL Fan Hub</h1>
            <p className="text-muted-foreground text-sm">Your destination for all things URFL</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 mt-8">
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-6 overflow-hidden relative">
            
            <div className="relative z-10">
              <Badge className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Season 1 Highlights
              </Badge>
              
              <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                Week {currentWeek} is Here!
              </h2>
              
              <p className="text-muted-foreground mb-6 max-w-lg">
                Catch all the action with live scores, real-time chat, and complete coverage of every matchup this week.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setLocation("/scores")} className="gap-2">
                  <Zap className="w-4 h-4" />
                  View Live Scores
                </Button>
                <Button variant="outline" onClick={() => setLocation("/schedule")} className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Full Schedule
                </Button>
              </div>
            </div>
            
            <div className="absolute -bottom-8 -right-8 text-[150px] opacity-5 select-none">
              🏈
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Quick Stats
            </h3>
            <span className="text-2xl">⚡</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Current Week</span>
              <span className="font-bold text-lg">{currentWeek}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Games This Week</span>
              <span className="font-bold text-lg">{games?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Live Now</span>
              <span className="font-bold text-lg">{liveGames.length}</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => setLocation("/standings")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Standings
          </Button>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              This Week's Games
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/scores")} className="text-primary">
              See All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {gamesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : games && games.length > 0 ? (
            <div className="space-y-4">
              {games.slice(0, 4).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => setLocation(`/game/${game.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed border-2">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-muted-foreground">No games scheduled yet</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
            </Card>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Newspaper className="w-4 h-4 text-secondary" />
              </div>
              Latest News
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/news")} className="text-secondary">
              See All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {newsLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : featuredNews.length > 0 ? (
            <div className="space-y-4">
              {featuredNews.map((post, index) => (
                <Link key={post.id} href={`/news/${post.id}`}>
                  <Card className="p-5 cursor-pointer hover:border-secondary/30 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{index === 0 ? '📰' : '✨'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          {format(new Date(post.createdAt!), "MMM d, yyyy")}
                        </p>
                        <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt || post.content}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed border-2">
              <div className="text-4xl mb-3">📰</div>
              <p className="text-muted-foreground">No news yet</p>
              <p className="text-sm text-muted-foreground mt-1">Stay tuned for updates!</p>
            </Card>
          )}
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Quick Access
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Zap, label: "Live Scores", path: "/scores", color: "primary" },
            { icon: Calendar, label: "Schedule", path: "/schedule", color: "secondary" },
            { icon: Trophy, label: "Playoffs", path: "/playoffs", color: "accent" },
            { icon: BarChart3, label: "Standings", path: "/standings", color: "primary" },
            { icon: Target, label: "Betting", path: "/betting", color: "secondary" },
            { icon: Newspaper, label: "News", path: "/news", color: "accent" },
          ].map((item, index) => {
            const Icon = item.icon;
            const colorClass = item.color === 'primary' ? 'bg-primary/10 text-primary hover:bg-primary/20' :
                              item.color === 'secondary' ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' :
                              'bg-accent/10 text-accent hover:bg-accent/20';
            return (
              <Card 
                key={item.path}
                className={`p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${colorClass}`}
                onClick={() => setLocation(item.path)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-4xl">
              <span>⚡</span>
              <span>🏈</span>
              <span>🎯</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Welcome to URFL Fan Hub!</h3>
              <p className="text-muted-foreground text-sm">Check out all the latest news and scores!</p>
            </div>
          </div>
          <a href="/login">
            <Button variant="outline" className="gap-2 border-secondary/30 hover:bg-secondary/10">
              <span>🔥</span>
              Login to your account
            </Button>
          </a>
        </div>
      </Card>
      {showTour && <SiteTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}
