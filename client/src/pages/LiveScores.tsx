import { useQuery } from "@tanstack/react-query";
import { GameCard } from "@/components/GameCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Game } from "@shared/schema";
import { useLocation } from "wouter";
import { AlertCircle, Search } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useState } from "react";

export default function LiveScores() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [primetimeFilter, setPrimetimeFilter] = useState<"all" | "primetime" | "regular">("all");
  const preferences = useUserPreferences();
  
  const { data: games, isLoading, error } = useQuery<Game[]>({
    queryKey: ["/api/games/current"],
    refetchInterval: 30000,
  });

  // Filter games by search query and primetime status
  const filteredGames = games ? games.filter(game => {
    const matchesSearch = game.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.team2.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrimetime = 
      primetimeFilter === "all" ||
      (primetimeFilter === "primetime" && game.isPrimetime) ||
      (primetimeFilter === "regular" && !game.isPrimetime);
    return matchesSearch && matchesPrimetime;
  }) : [];

  // Sort games with favorite team first
  const sortedGames = filteredGames ? [...filteredGames].sort((a, b) => {
    if (preferences.favoriteTeam) {
      const aHasFavorite = a.team1 === preferences.favoriteTeam || a.team2 === preferences.favoriteTeam;
      const bHasFavorite = b.team1 === preferences.favoriteTeam || b.team2 === preferences.favoriteTeam;
      if (aHasFavorite && !bHasFavorite) return -1;
      if (!aHasFavorite && bHasFavorite) return 1;
    }
    return 0;
  }) : [];

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load games</p>
        </div>
      </div>
    );
  }

  const currentWeek = games && games.length > 0 ? games[0].week : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl md:text-5xl font-black" data-testid="text-page-title">
            Live Scores
          </h1>
          <Badge variant="outline" className="text-lg px-4 py-2" data-testid="badge-current-week">
            Week {currentWeek}
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg mb-4">
          Follow all the action as it happens
        </p>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by team name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={primetimeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPrimetimeFilter("all")}
            >
              All Games
            </Button>
            <Button
              variant={primetimeFilter === "primetime" ? "default" : "outline"}
              size="sm"
              onClick={() => setPrimetimeFilter("primetime")}
            >
              Primetime
            </Button>
            <Button
              variant={primetimeFilter === "regular" ? "default" : "outline"}
              size="sm"
              onClick={() => setPrimetimeFilter("regular")}
            >
              Regular
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : sortedGames && sortedGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => setLocation(`/game/${game.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            No games scheduled for this week yet
          </p>
        </div>
      )}
    </div>
  );
}
