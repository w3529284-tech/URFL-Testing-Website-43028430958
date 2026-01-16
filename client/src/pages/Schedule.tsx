import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Game } from "@shared/schema";
import { isFuture, isPast } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar, MapPin, AlertCircle, Search, Clock, Trophy } from "lucide-react";
import { TEAMS } from "@/lib/teams";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useState } from "react";

export default function Schedule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [primetimeFilter, setPrimetimeFilter] = useState<"all" | "primetime" | "regular">("all");
  const preferences = useUserPreferences();
  const showLogos = preferences.showTeamLogos !== false;
  
  const { data: allGames, isLoading, error } = useQuery<Game[]>({
    queryKey: ["/api/games/all"],
    queryFn: async () => {
      const res = await fetch(`/api/games/all?season=2`);
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    }
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-xl font-black uppercase tracking-tighter italic">Schedule Offline</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">Retry Load</Button>
        </div>
      </div>
    );
  }

  const filteredGames = allGames ? allGames.filter(game => {
    const matchesSearch = game.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.team2.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrimetime = 
      primetimeFilter === "all" ||
      (primetimeFilter === "primetime" && game.isPrimetime) ||
      (primetimeFilter === "regular" && !game.isPrimetime);
    return matchesSearch && matchesPrimetime;
  }) : [];

  const gamesByWeek = filteredGames?.reduce((acc, game) => {
    if (game.week <= 15 && !acc[game.week]) {
      acc[game.week] = [];
    }
    if (game.week <= 15) {
      acc[game.week].push(game);
    }
    return acc;
  }, {} as Record<number, Game[]>) || {};

  const weeks = Object.keys(gamesByWeek).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full w-fit">
            Season Itinerary
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-[0.9]">
            Schedule <span className="text-muted-foreground/20">S2</span>
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search matchups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 transition-all font-bold text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-12">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-6">
              <Skeleton className="h-8 w-40 bg-card/50 rounded-full" />
              <div className="grid gap-4">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-32 bg-card/50 rounded-[32px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : weeks.length > 0 ? (
        <div className="space-y-16">
          {weeks.map((week) => (
            <div key={week} className="space-y-8">
              <div className="flex items-center gap-6">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-primary">Week {week}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
              </div>
              
              <div className="grid gap-4">
                {gamesByWeek[week].map((game) => {
                  const gameDate = game.gameTime ? new Date(game.gameTime) : null;
                  const isUpcoming = gameDate ? isFuture(gameDate) : false;
                  
                  return (
                    <Card key={game.id} className="group p-6 bg-card/40 backdrop-blur-xl border-border/40 hover:bg-card/60 transition-all duration-300 rounded-[32px] overflow-hidden">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-8 flex-1">
                          <div className="flex items-center -space-x-4">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shadow-2xl group-hover:scale-110 transition-transform">
                              <img src={TEAMS[game.team2 as keyof typeof TEAMS]} className="w-full h-full object-contain" />
                            </div>
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shadow-2xl group-hover:scale-110 transition-transform">
                              <img src={TEAMS[game.team1 as keyof typeof TEAMS]} className="w-full h-full object-contain" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-black italic uppercase tracking-tight">
                              {game.team2} <span className="text-muted-foreground/30 text-base not-italic mx-2">VS</span> {game.team1}
                            </h3>
                            <div className="flex items-center gap-4">
                              <Badge className={`text-[9px] font-black uppercase tracking-widest h-5 ${game.isLive ? 'bg-primary' : 'bg-muted/50 border-none'}`}>
                                {game.isLive ? 'Live' : game.isFinal ? 'Final' : isUpcoming ? 'Scheduled' : 'Past'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 lg:text-right border-t lg:border-t-0 border-white/5 pt-6 lg:pt-0">
                          <div className="space-y-1">
                            <div className="flex items-center lg:justify-end gap-2 text-primary font-black italic tracking-tight">
                              <Calendar className="w-4 h-4" />
                              <span>{gameDate ? formatInTimeZone(gameDate, "America/New_York", "MMM d, yyyy") : "TBD"}</span>
                            </div>
                            <div className="flex items-center lg:justify-end gap-2 text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-40">
                              <Clock className="w-3 h-3" />
                              <span>{gameDate ? formatInTimeZone(gameDate, "America/New_York", "h:mm a 'EST'") : "Time TBD"}</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Trophy className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-card/10 rounded-[40px] border border-dashed border-white/5">
          <Calendar className="w-16 h-16 text-muted-foreground/10 mx-auto mb-6" />
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-muted-foreground/40">Schedule Locked</h3>
          <p className="text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest mt-2">New dates coming soon</p>
        </div>
      )}
    </div>
  );
}
