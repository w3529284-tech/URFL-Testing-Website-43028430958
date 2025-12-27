import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Game } from "@shared/schema";
import { AlertCircle, TrendingUp, Clock, Coins } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";

export default function Betting() {
  const { user, isAuthenticated } = useAuth();
  const [bets, setBets] = useState<Record<string, { team: string; amount: number }>>({});

  const { data: games = [], isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/current"],
  });

  const { data: userBalance = 1000 } = useQuery<number>({
    queryKey: ["/api/balance"],
    enabled: isAuthenticated,
    select: (data: any) => data.balance || 1000,
  });

  const { data: userBets = [] } = useQuery<any[]>({
    queryKey: [`/api/bets`],
    enabled: isAuthenticated,
  });

  const placeBetMutation = useMutation({
    mutationFn: async ({ gameId, team, amount }: { gameId: string; team: string; amount: number }) => {
      return apiRequest("POST", "/api/bets", { gameId, pickedTeam: team, amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bets`] });
      queryClient.invalidateQueries({ queryKey: [`/api/balance`] });
      setBets({});
    },
  });

  const handlePlaceBet = (gameId: string, team: string, amount: number) => {
    if (!isAuthenticated) {
      alert("Please login to place a bet");
      return;
    }
    if (amount <= 0) {
      alert("Bet amount must be greater than 0");
      return;
    }
    if (amount > userBalance) {
      alert("Insufficient balance");
      return;
    }
    placeBetMutation.mutate({ gameId, team, amount });
  };

  const handleInputChange = (gameId: string, team: string, amount: string) => {
    const num = parseInt(amount) || 0;
    setBets({
      ...bets,
      [gameId]: { team, amount: num },
    });
  };

  const currentWeek = games.length > 0
    ? Math.max(...games.map(g => g.week))
    : 1;

  const currentWeekGames = games.filter(g => g.week === currentWeek);
  const totalBetAmount = Object.values(bets).reduce((sum, b) => sum + b.amount, 0);
  const remainingBalance = userBalance - totalBetAmount;

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
        <div className="text-right">
          <Badge className="text-lg px-4 py-2 mb-2" data-testid="badge-current-week">
            Week {currentWeek}
          </Badge>
          {isAuthenticated && (
            <div className="flex items-center gap-2 justify-end mt-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{remainingBalance}</span>
            </div>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <Card className="p-6 mb-8 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <p>Sign in to place bets on games. You start with 1,000 coins!</p>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">This Week's Games</h2>
        
        {gamesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {currentWeekGames.map((game) => {
                const gameBet = bets[game.id];
                const userGameBets = userBets?.filter((b: any) => b.gameId === game.id) || [];

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

                      {/* Matchup */}
                      <div className="space-y-2">
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
                            {/* Team 1 Bet */}
                            <div className="space-y-2">
                              <Button
                                variant={gameBet?.team === game.team1 ? "default" : "outline"}
                                className="w-full justify-start h-auto py-3"
                                onClick={() => handlePlaceBet(game.id, game.team1, gameBet?.amount || 0)}
                                disabled={!isAuthenticated || (game.isLive ?? false) || (game.isFinal ?? false)}
                                data-testid={`button-bet-${game.id}-${game.team1}`}
                              >
                                <span className="flex-1 text-left">{game.team1}</span>
                                {gameBet?.team === game.team1 && <TrendingUp className="w-4 h-4" />}
                              </Button>
                              {gameBet?.team === game.team1 && (
                                <Input
                                  type="number"
                                  min="1"
                                  value={gameBet.amount}
                                  onChange={(e) => handleInputChange(game.id, game.team1, e.target.value)}
                                  placeholder="Enter bet amount"
                                  className="text-sm"
                                />
                              )}
                            </div>

                            {/* Team 2 Bet */}
                            <div className="space-y-2">
                              <Button
                                variant={gameBet?.team === game.team2 ? "default" : "outline"}
                                className="w-full justify-start h-auto py-3"
                                onClick={() => handlePlaceBet(game.id, game.team2, gameBet?.amount || 0)}
                                disabled={!isAuthenticated || (game.isLive ?? false) || (game.isFinal ?? false)}
                                data-testid={`button-bet-${game.id}-${game.team2}`}
                              >
                                <span className="flex-1 text-left">{game.team2}</span>
                                {gameBet?.team === game.team2 && <TrendingUp className="w-4 h-4" />}
                              </Button>
                              {gameBet?.team === game.team2 && (
                                <Input
                                  type="number"
                                  min="1"
                                  value={gameBet.amount}
                                  onChange={(e) => handleInputChange(game.id, game.team2, e.target.value)}
                                  placeholder="Enter bet amount"
                                  className="text-sm"
                                />
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Pending Bets */}
                      {userGameBets.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-sm text-muted-foreground mb-2">Your Bets:</p>
                          {userGameBets.map((bet: any) => (
                            <Badge key={bet.id} className="bg-primary/20 text-primary border-primary/30 mr-2">
                              {bet.pickedTeam}: {bet.amount} coins
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Bet Summary */}
            {totalBetAmount > 0 && (
              <Card className="p-6 bg-primary/10 border-primary/30">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Bet Amount:</span>
                    <span className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      {totalBetAmount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Remaining Balance:</span>
                    <span className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      {remainingBalance}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-4 gap-2"
                    onClick={() => {
                      Object.entries(bets).forEach(([gameId, bet]) => {
                        handlePlaceBet(gameId, bet.team, bet.amount);
                      });
                    }}
                    disabled={totalBetAmount === 0 || placeBetMutation.isPending}
                  >
                    <Coins className="w-4 h-4" />
                    {placeBetMutation.isPending ? "Placing Bets..." : "Place All Bets"}
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
