import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Game } from "@shared/schema";
import { AlertCircle, TrendingUp, Clock } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Betting() {
  const { user, isAuthenticated } = useAuth();
  const [selectedBets, setSelectedBets] = useState<Record<string, string>>({});

  const { data: games = [], isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/current"],
  });

  const { data: userPredictions = [] } = useQuery<any[]>({
    queryKey: [`/api/predictions`],
    enabled: isAuthenticated,
  });

  const placeBetMutation = useMutation({
    mutationFn: async ({ gameId, team }: { gameId: string; team: string }) => {
      return apiRequest("POST", "/api/predictions", { gameId, votedFor: team });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/predictions`] });
    },
  });

  const handlePlaceBet = (gameId: string, team: string) => {
    if (!isAuthenticated) {
      alert("Please login to place a bet");
      return;
    }
    placeBetMutation.mutate({ gameId, team });
    setSelectedBets({ ...selectedBets, [gameId]: team });
  };

  const currentWeek = games.length > 0
    ? Math.max(...games.map(g => g.week))
    : 1;

  const currentWeekGames = games.filter(g => g.week === currentWeek);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="text-page-title">
            Weekly Betting
          </h1>
          <p className="text-muted-foreground text-lg">
            Place your bets on each game and compete with other fans
          </p>
        </div>
        <Badge className="text-lg px-4 py-2" data-testid="badge-current-week">
          Week {currentWeek}
        </Badge>
      </div>

      {!isAuthenticated && (
        <Card className="p-6 mb-8 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <p>Sign in to place bets on games</p>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">This Week's Games</h2>
        
        {gamesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : currentWeekGames.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No games scheduled for this week yet
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentWeekGames.map((game) => {
              const userBet = userPredictions.find((p: any) => p.gameId === game.id);
              const betTeam = selectedBets[game.id] || userBet?.votedFor;

              return (
                <Card key={game.id} className="p-6 hover:shadow-lg transition-shadow" data-testid={`card-game-${game.id}`}>
                  <div className="space-y-4">
                    {/* Game Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {game.gameTime 
                            ? formatDistanceToNow(new Date(game.gameTime), { addSuffix: true })
                            : "TBA"}
                        </span>
                      </div>
                      <Badge 
                        variant={(game.isFinal ?? false) ? "default" : (game.isLive ?? false) ? "secondary" : "outline"}
                        data-testid={`badge-status-${game.id}`}
                      >
                        {(game.isFinal ?? false) ? "Final" : (game.isLive ?? false) ? "Live" : "Upcoming"}
                      </Badge>
                    </div>

                    {/* Score or Teams */}
                    <div className="space-y-3">
                      {(game.isLive ?? false) || (game.isFinal ?? false) ? (
                        <>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                            <span className="font-semibold">{game.team1}</span>
                            <span className="text-2xl font-black">{game.team1Score}</span>
                          </div>
                          <div className="text-center text-sm text-muted-foreground font-semibold">
                            {game.quarter}
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                            <span className="font-semibold">{game.team2}</span>
                            <span className="text-2xl font-black">{game.team2Score}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Button
                            variant={betTeam === game.team1 ? "default" : "outline"}
                            className="w-full justify-between h-auto py-3"
                            onClick={() => handlePlaceBet(game.id, game.team1)}
                            disabled={!isAuthenticated || (game.isLive ?? false) || (game.isFinal ?? false)}
                            data-testid={`button-bet-${game.id}-${game.team1}`}
                          >
                            <span>{game.team1}</span>
                            {betTeam === game.team1 && <TrendingUp className="w-4 h-4 ml-2" />}
                          </Button>
                          <Button
                            variant={betTeam === game.team2 ? "default" : "outline"}
                            className="w-full justify-between h-auto py-3"
                            onClick={() => handlePlaceBet(game.id, game.team2)}
                            disabled={!isAuthenticated || (game.isLive ?? false) || (game.isFinal ?? false)}
                            data-testid={`button-bet-${game.id}-${game.team2}`}
                          >
                            <span>{game.team2}</span>
                            {betTeam === game.team2 && <TrendingUp className="w-4 h-4 ml-2" />}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Current Bet Display */}
                    {betTeam && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground mb-1">Your Bet:</p>
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {betTeam}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
