import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { calculateWinProbability, calculateOdds } from "@/lib/winProbability";
import type { Game, Standings } from "@shared/schema";
import { AlertCircle, TrendingUp, Clock, Coins, X, Zap, Search, Trophy } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Betting() {
  const { user, isAuthenticated } = useAuth();
  const [bets, setBets] = useState<Record<string, { team: string; amount: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [primetimeFilter, setPrimetimeFilter] = useState<"all" | "primetime" | "regular">("all");
  const [myBetsSearchQuery, setMyBetsSearchQuery] = useState("");
  const [myBetsPrimetimeFilter, setMyBetsPrimetimeFilter] = useState<"all" | "primetime" | "regular">("all");
  const [myBetsStatusFilter, setMyBetsStatusFilter] = useState<"all" | "live" | "past">("all");
  const [myBetsResultFilter, setMyBetsResultFilter] = useState<"all" | "won" | "lost">("all");

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

  const { data: allGames = [] } = useQuery<Game[]>({
    queryKey: ["/api/games/all"],
  });

  const { data: leaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
  });

  const activeUserBets = userBets.filter(bet => allGames.some(game => game.id === bet.gameId));

  const placeBetMutation = useMutation({
    mutationFn: async ({ gameId, team, amount, odds }: { gameId: string; team: string; amount: number; odds: number }) => {
      console.log("Placing bet:", { gameId, pickedTeam: team, amount, odds });
      return apiRequest("POST", "/api/bets", { gameId, pickedTeam: team, amount, odds });
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
    const game = games.find(g => g.id === gameId);
    if (!game) {
      console.error("Game not found:", gameId);
      return;
    }
    
    const bet = bets[gameId];
    if (!bet || bet.amount <= 0) {
      alert("Enter a valid bet amount");
      return;
    }
    if (bet.amount > userBalance) {
      alert("Insufficient balance");
      return;
    }
    const odds = getOdds(game, bet.team);
    console.log("Placing bet from UI:", { gameId, team: bet.team, amount: bet.amount, odds });
    placeBetMutation.mutate({ gameId, team: bet.team, amount: bet.amount, odds });
  };

  const handleRemoveBet = (gameId: string) => {
    const newBets = { ...bets };
    delete newBets[gameId];
    setBets(newBets);
  };

  const { data: standings = [] } = useQuery<Standings[]>({
    queryKey: ["/api/standings"],
  });

  const getOdds = (game: Game, team: string) => {
    const prob = calculateWinProbability(
      game,
      team === game.team1 ? "team1" : "team2",
      standings,
      allGames
    );
    return calculateOdds(prob);
  };

  const getPotentialWinnings = (game: Game, team: string, amount: number) => {
    const odds = getOdds(game, team);
    return amount * odds;
  };

  const currentWeek = games.length > 0
    ? Math.max(...games.map(g => g.week))
    : 1;

  const currentWeekGames = games.filter(g => g.week === currentWeek);

  // Filter games by search query and primetime status
  const filteredGames = currentWeekGames.filter(game => {
    const matchesSearch = game.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.team2.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrimetime = 
      primetimeFilter === "all" ||
      (primetimeFilter === "primetime" && game.isPrimetime) ||
      (primetimeFilter === "regular" && !game.isPrimetime);
    return matchesSearch && matchesPrimetime;
  });

  const totalBetAmount = Object.values(bets).reduce((sum, b) => sum + b.amount, 0);
  const remainingBalance = userBalance - totalBetAmount;

  // Sort bets by game time (most recent first)
  const sortedUserBets = [...activeUserBets].sort((a, b) => {
    const gameA = games.find(g => g.id === a.gameId);
    const gameB = games.find(g => g.id === b.gameId);
    const timeA = gameA?.gameTime ? new Date(gameA.gameTime).getTime() : 0;
    const timeB = gameB?.gameTime ? new Date(gameB.gameTime).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="text-page-title">
            Betting
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

      <Tabs defaultValue="this-week" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="this-week">This Week's Games</TabsTrigger>
          <TabsTrigger value="my-bets">My Bets {activeUserBets.length > 0 && <Badge className="ml-2">{activeUserBets.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard
            </h2>
            <div className="space-y-4">
              {leaderboard.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-muted-foreground w-8">#{i + 1}</span>
                    <span className="font-bold">{u.username || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2 font-black text-xl text-yellow-500">
                    <Coins className="w-5 h-5" />
                    {u.coins.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="this-week" className="space-y-6">
          {/* Search and Filters */}
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

          {/* Games Grid */}
          {gamesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {currentWeekGames.length === 0 
                    ? "No games scheduled for this week yet"
                    : "No games match your filters"}
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {filteredGames.map((game) => {
                  const gameBet = bets[game.id];
                  const userGameBets = userBets?.filter((b: any) => b.gameId === game.id) || [];
                  const maxBet = Math.min(1000, remainingBalance);

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
                                <div className="flex items-center gap-2 flex-1 text-left">
                                  <span className="font-semibold">{game.team1}</span>
                                  <Badge variant={gameBet?.team === game.team1 ? "default" : "secondary"} className="gap-1">
                                    <Zap className="w-3 h-3" />
                                    {getOdds(game, game.team1).toFixed(2)}x
                                  </Badge>
                                </div>
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
                                  
                                  {/* Potential Winnings Display */}
                                  {gameBet.amount > 0 && (
                                    <div className="bg-accent/20 p-2 rounded text-center">
                                      <p className="text-xs text-muted-foreground">Potential Winnings</p>
                                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-accent">
                                        <Coins className="w-4 h-4" />
                                        {Math.floor(getPotentialWinnings(game, game.team1, gameBet.amount)).toLocaleString()}
                                      </div>
                                    </div>
                                  )}

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
                                <div className="flex items-center gap-2 flex-1 text-left">
                                  <span className="font-semibold">{game.team2}</span>
                                  <Badge variant={gameBet?.team === game.team2 ? "default" : "secondary"} className="gap-1">
                                    <Zap className="w-3 h-3" />
                                    {getOdds(game, game.team2).toFixed(2)}x
                                  </Badge>
                                </div>
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

                                  {/* Potential Winnings Display */}
                                  {gameBet.amount > 0 && (
                                    <div className="bg-accent/20 p-2 rounded text-center">
                                      <p className="text-xs text-muted-foreground">Potential Winnings</p>
                                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-accent">
                                        <Coins className="w-4 h-4" />
                                        {Math.floor(getPotentialWinnings(game, game.team2, gameBet.amount)).toLocaleString()}
                                      </div>
                                    </div>
                                  )}

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
                        <div className="flex items-center gap-2 text-2xl font-bold text-primary">
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
        </TabsContent>

        <TabsContent value="my-bets" className="space-y-6">
          {!isAuthenticated ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Sign in to view your bets</p>
                <Button onClick={() => window.location.href = "/login"}>
                  Sign In
                </Button>
              </div>
            </Card>
          ) : sortedUserBets.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No bets placed yet</p>
                <p className="text-muted-foreground text-sm mt-2">Start betting on this week's games to see them here</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by team name..."
                    value={myBetsSearchQuery}
                    onChange={(e) => setMyBetsSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={myBetsStatusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsStatusFilter("all")}
                  >
                    All Bets
                  </Button>
                  <Button
                    variant={myBetsStatusFilter === "live" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsStatusFilter("live")}
                  >
                    Live Bets
                  </Button>
                  <Button
                    variant={myBetsStatusFilter === "past" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsStatusFilter("past")}
                  >
                    Past Bets
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={myBetsPrimetimeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsPrimetimeFilter("all")}
                  >
                    All Games
                  </Button>
                  <Button
                    variant={myBetsPrimetimeFilter === "primetime" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsPrimetimeFilter("primetime")}
                  >
                    Primetime
                  </Button>
                  <Button
                    variant={myBetsPrimetimeFilter === "regular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsPrimetimeFilter("regular")}
                  >
                    Regular
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={myBetsResultFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsResultFilter("all")}
                  >
                    All Results
                  </Button>
                  <Button
                    variant={myBetsResultFilter === "won" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsResultFilter("won")}
                  >
                    Won Bets
                  </Button>
                  <Button
                    variant={myBetsResultFilter === "lost" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyBetsResultFilter("lost")}
                  >
                    Lost Bets
                  </Button>
                </div>
              </div>

              {/* Filtered Bets */}
              {(() => {
                const filteredBets = sortedUserBets.filter((bet: any) => {
                  const game = games.find(g => g.id === bet.gameId);
                  if (!game) return false;

                  // Search filter
                  const matchesSearch = 
                    game.team1.toLowerCase().includes(myBetsSearchQuery.toLowerCase()) ||
                    game.team2.toLowerCase().includes(myBetsSearchQuery.toLowerCase()) ||
                    bet.pickedTeam.toLowerCase().includes(myBetsSearchQuery.toLowerCase());

                  // Status filter (live vs past)
                  const matchesStatus = 
                    myBetsStatusFilter === "all" ||
                    (myBetsStatusFilter === "live" && !game.isFinal) ||
                    (myBetsStatusFilter === "past" && game.isFinal);

                  // Primetime filter
                  const matchesPrimetime = 
                    myBetsPrimetimeFilter === "all" ||
                    (myBetsPrimetimeFilter === "primetime" && game.isPrimetime) ||
                    (myBetsPrimetimeFilter === "regular" && !game.isPrimetime);

                  // Result filter (won/lost)
                  let matchesResult = true;
                  if (myBetsResultFilter !== "all" && game.isFinal && game.team1Score !== null && game.team2Score !== null) {
                    const didBetWin = 
                      (bet.pickedTeam === game.team1 && game.team1Score > game.team2Score) ||
                      (bet.pickedTeam === game.team2 && game.team2Score > game.team1Score);
                    
                    if (myBetsResultFilter === "won") {
                      matchesResult = didBetWin;
                    } else if (myBetsResultFilter === "lost") {
                      matchesResult = !didBetWin;
                    }
                  } else if (myBetsResultFilter !== "all" && (!game.isFinal || game.team1Score === null || game.team2Score === null)) {
                    // If game is not final or scores are null, don't show these bets when filtering for won/lost
                    matchesResult = false;
                  }

                  return matchesSearch && matchesStatus && matchesPrimetime && matchesResult;
                });

                return filteredBets.length === 0 ? (
                  <Card className="p-6">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No bets match your filters
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBets.map((bet: any) => {
                      const game = games.find(g => g.id === bet.gameId);
                      if (!game) return null;

                      const odds = bet.odds || getOdds(game, bet.pickedTeam);
                      const potentialWinnings = Math.floor(bet.amount * odds);
                      const isLiveOrFinal = game.isLive || game.isFinal;
                      
                      // Calculate if bet was won or lost
                      let betResult = null;
                      if (game.isFinal && game.team1Score !== null && game.team2Score !== null) {
                        const didBetWin = 
                          (bet.pickedTeam === game.team1 && game.team1Score > game.team2Score) ||
                          (bet.pickedTeam === game.team2 && game.team2Score > game.team1Score);
                        betResult = didBetWin ? "won" : "lost";
                      }

                      return (
                        <Card key={bet.id} className="p-4 hover:shadow-lg transition-shadow">
                          <div className="space-y-3">
                            {/* Game Info */}
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Badge 
                                  variant={isLiveOrFinal ? (game.isFinal ? "default" : "secondary") : "outline"}
                                >
                                  {isLiveOrFinal ? (game.isFinal ? "Final" : "Live") : "Upcoming"}
                                </Badge>
                                {betResult && (
                                  <Badge 
                                    variant={betResult === "won" ? "default" : "destructive"}
                                  >
                                    {betResult === "won" ? "Won" : "Lost"}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Week {game.week}
                              </span>
                            </div>

                            {/* Matchup */}
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Game</p>
                              <p className="font-semibold text-sm">
                                {game.team1} vs {game.team2}
                              </p>
                            </div>

                            {/* Your Bet */}
                            <div className="bg-primary/10 p-3 rounded-lg border border-primary/30">
                              <p className="text-xs text-muted-foreground mb-1">Your Pick</p>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">{bet.pickedTeam}</span>
                                <Badge variant="secondary" className="gap-1">
                                  <Zap className="w-3 h-3" />
                                  {odds.toFixed(2)}x
                                </Badge>
                              </div>
                            </div>

                            {/* Bet Amount and Potential Winnings */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground mb-1">Bet Amount</p>
                                <div className="flex items-center gap-1 font-semibold">
                                  <Coins className="w-3 h-3" />
                                  {bet.amount}
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Potential Win</p>
                                <div className="flex items-center gap-1 font-semibold text-accent">
                                  <Coins className="w-3 h-3" />
                                  {potentialWinnings}
                                </div>
                              </div>
                            </div>

                            {/* Game Time */}
                            {game.gameTime && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(game.gameTime), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}

          {/* Bet Stats Summary */}
          {sortedUserBets.length > 0 && (
            <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Betting Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Bets</p>
                    <div className="text-2xl font-bold">{sortedUserBets.length}</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Wagered</p>
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      {Math.floor(sortedUserBets.reduce((sum, b) => sum + b.amount, 0))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Potential Winnings</p>
                    <div className="flex items-center gap-2 text-2xl font-bold text-accent">
                      <Coins className="w-5 h-5" />
                      {Math.floor(sortedUserBets.reduce((sum, b) => sum + (b.amount * (b.odds || 1.5)), 0))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
