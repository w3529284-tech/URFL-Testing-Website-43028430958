import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Game } from "@shared/schema";
import { AlertCircle, TrendingUp, Clock, Coins, X } from "lucide-react";
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

  const handleSelectTeam = (gameId: string, team: string) => {
    if (!isAuthenticated) {
      alert("Please login to place a bet");
      return;
    }
    setBets({
      ...bets,
      [gameId]: { team, amount: bets[gameId]?.amount || 10 },
    });
  };

  const handleAmountChange = (gameId: string, amount: string) => {
    const num = parseInt(amount) || 0;
    if (bets[gameId]) {
      setBets({
        ...bets,
        [gameId]: { ...bets[gameId], amount: Math.max(0, num) },
      });
    }
  };

  const handleQuickBet = (gameId: string, quickAmount: number) => {
    if (bets[gameId]) {
      setBets({
        ...bets,
        [gameId]: { ...bets[gameId], amount: quickAmount },
      });
    }
  };

  const handlePlaceBet = (gameId: string) => {
    const bet = bets[gameId];
    if (!bet || bet.amount <= 0) {
      alert("Enter a valid bet amount");
      return;
    }
    if (bet.amount > userBalance) {
      alert("Insufficient balance");
      return;
    }
    placeBetMutation.mutate({ gameId, team: bet.team, amount: bet.amount });
  };

  const handleRemoveBet = (gameId: string) => {
    const newBets = { ...bets };
    delete newBets[gameId];
    setBets(newBets);
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
              <div>
                <div className="text-2xl font-bold">{remainingBalance}</div>
                <div className="text-xs text-muted-foreground">Available Coins</div>
              </div>
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
              <Skeleton key={i} className="h-96" />
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
                const maxBet = Math.min(1000, remainingBalance); // Max 1000 per bet

                return (
                  <Card key={game.id} className="p-6 hover:shadow-lg transition-shadow" data-testid={`card-game-${game.id}`}>
                    <div className="space-y-4">
                      {/* Game Header */}
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

                      {/* Game Status or Betting Interface */}
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
                            {/* Team 1 Betting Button */}
                            <Button
                              variant={gameBet?.team === game.team1 ? "default" : "outline"}
                              className="w-full justify-between h-auto py-3"
                              onClick={() => handleSelectTeam(game.id, game.team1)}
                              disabled={!isAuthenticated}
                              data-testid={`button-bet-${game.id}-${game.team1}`}
                            >
                              <span className="font-semibold">{game.team1}</span>
                              {gameBet?.team === game.team1 && <TrendingUp className="w-4 h-4" />}
                            </Button>

                            {/* Team 1 Bet Amount Input */}
                            {gameBet?.team === game.team1 && (
                              <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">Bet Amount</label>
                                  <span className="text-xs text-muted-foreground">
                                    Max: <span className="font-semibold">{maxBet}</span>
                                  </span>
                                </div>
                                <Input
                                  type="number"
                                  min="1"
                                  max={maxBet}
                                  value={gameBet.amount}
                                  onChange={(e) => handleAmountChange(game.id, e.target.value)}
                                  placeholder="Enter bet amount"
                                  className="text-base font-semibold"
                                />
                                <div className="flex gap-2">
                                  {[10, 50, 100, 500].map((amt) => (
                                    <Button
                                      key={amt}
                                      size="sm"
                                      variant="ghost"
                                      className="flex-1 text-xs"
                                      onClick={() => handleQuickBet(game.id, amt)}
                                      disabled={amt > maxBet}
                                    >
                                      {amt}
                                    </Button>
                                  ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    className="flex-1 gap-2"
                                    size="sm"
                                    onClick={() => handlePlaceBet(game.id)}
                                    disabled={gameBet.amount <= 0 || placeBetMutation.isPending}
                                  >
                                    <Coins className="w-3 h-3" />
                                    Place Bet
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveBet(game.id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Team 2 Betting Button */}
                            <Button
                              variant={gameBet?.team === game.team2 ? "default" : "outline"}
                              className="w-full justify-between h-auto py-3"
                              onClick={() => handleSelectTeam(game.id, game.team2)}
                              disabled={!isAuthenticated}
                              data-testid={`button-bet-${game.id}-${game.team2}`}
                            >
                              <span className="font-semibold">{game.team2}</span>
                              {gameBet?.team === game.team2 && <TrendingUp className="w-4 h-4" />}
                            </Button>

                            {/* Team 2 Bet Amount Input */}
                            {gameBet?.team === game.team2 && (
                              <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">Bet Amount</label>
                                  <span className="text-xs text-muted-foreground">
                                    Max: <span className="font-semibold">{maxBet}</span>
                                  </span>
                                </div>
                                <Input
                                  type="number"
                                  min="1"
                                  max={maxBet}
                                  value={gameBet.amount}
                                  onChange={(e) => handleAmountChange(game.id, e.target.value)}
                                  placeholder="Enter bet amount"
                                  className="text-base font-semibold"
                                />
                                <div className="flex gap-2">
                                  {[10, 50, 100, 500].map((amt) => (
                                    <Button
                                      key={amt}
                                      size="sm"
                                      variant="ghost"
                                      className="flex-1 text-xs"
                                      onClick={() => handleQuickBet(game.id, amt)}
                                      disabled={amt > maxBet}
                                    >
                                      {amt}
                                    </Button>
                                  ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    className="flex-1 gap-2"
                                    size="sm"
                                    onClick={() => handlePlaceBet(game.id)}
                                    disabled={gameBet.amount <= 0 || placeBetMutation.isPending}
                                  >
                                    <Coins className="w-3 h-3" />
                                    Place Bet
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveBet(game.id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Confirmed Bets Display */}
                      {userGameBets.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-sm font-semibold mb-2 text-muted-foreground">Confirmed Bets:</p>
                          <div className="space-y-1">
                            {userGameBets.map((bet: any) => (
                              <div key={bet.id} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                                <span className="text-sm">{bet.pickedTeam}</span>
                                <Badge variant="secondary" className="gap-1">
                                  <Coins className="w-3 h-3" />
                                  {bet.amount}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Bet Summary */}
            {totalBetAmount > 0 && (
              <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Bet Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Betting</p>
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        <Coins className="w-6 h-6 text-yellow-500" />
                        {totalBetAmount}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Remaining Balance</p>
                      <div className="flex items-center gap-2 text-2xl font-bold text-green-600 dark:text-green-400">
                        <Coins className="w-6 h-6" />
                        {remainingBalance}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      You have {Object.keys(bets).length} bet(s) pending confirmation
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
