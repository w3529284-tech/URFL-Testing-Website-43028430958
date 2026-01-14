import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { calculateWinProbability, calculateOdds, getWinProbabilityFactors } from "@/lib/winProbability";
import type { Game, Standings } from "@shared/schema";
import { AlertCircle, TrendingUp, Clock, Coins, X, Zap, Search, Trophy, Target, PlayCircle, BarChart3 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Betting() {
  const { user, isAuthenticated } = useAuth();
  const [bets, setBets] = useState<Record<string, { team: string; amount: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [primetimeFilter, setPrimetimeFilter] = useState<"all" | "primetime" | "regular">("all");

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

  const { data: standings = [] } = useQuery<Standings[]>({
    queryKey: ["/api/standings"],
  });

  const activeUserBets = userBets.filter(bet => allGames.some(game => game.id === bet.gameId));

  const placeBetMutation = useMutation({
    mutationFn: async ({ gameId, team, amount, odds }: { gameId: string; team: string; amount: number; odds: number }) => {
      return apiRequest("POST", "/api/bets", { gameId, pickedTeam: team, amount, odds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bets`] });
      queryClient.invalidateQueries({ queryKey: [`/api/balance`] });
      setBets({});
    },
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
    if (!game) return;
    
    const bet = bets[gameId];
    if (!bet || bet.amount <= 0 || bet.amount > userBalance) return;

    const odds = getOdds(game, bet.team);
    placeBetMutation.mutate({ gameId, team: bet.team, amount: bet.amount, odds: odds });
  };

  const currentWeek = games.length > 0 ? Math.max(...games.map(g => g.week)) : 1;
  const currentWeekGames = games.filter(g => g.week === currentWeek);

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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1.5 text-[11px] font-black uppercase tracking-widest w-fit">
              <Coins className="w-3.5 h-3.5 mr-2" />
              Fan Betting
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] text-foreground">
              Place Your <span className="text-primary">Bets</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-md leading-relaxed">
              Wager your coins on Season 2 matchups and climb the global fan leaderboard.
            </p>
          </div>

          <div className="flex gap-4">
            <Card className="p-6 bg-primary rounded-[32px] border-none shadow-2xl shadow-primary/20 overflow-hidden relative group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Balance</p>
                <p className="text-3xl font-black italic text-white flex items-center gap-2">
                  <Coins className="w-6 h-6" />
                  {remainingBalance.toLocaleString()}
                </p>
              </div>
            </Card>
            <Card className="p-6 bg-card/40 backdrop-blur-3xl border-border/40 rounded-[32px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Week</p>
              <p className="text-3xl font-black italic">W{currentWeek}</p>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="games" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8">
            {[
              { value: "games", label: "Matchups", icon: Target },
              { value: "my-bets", label: `My Bets (${activeUserBets.length})`, icon: TrendingUp },
              { value: "leaderboard", label: "Leaderboard", icon: Trophy },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-border/40 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <tab.icon className="w-3.5 h-3.5 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="games" className="space-y-10">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-xl group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-20 blur-xl group-focus-within:opacity-40 transition-opacity duration-500 rounded-2xl" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search matchups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                {["all", "primetime", "regular"].map((f) => (
                  <Button
                    key={f}
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrimetimeFilter(f as any)}
                    className={`h-9 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
                      primetimeFilter === f ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>

            {gamesLoading ? (
              <div className="grid md:grid-cols-2 gap-8">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-96 rounded-[40px] bg-card/40" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {filteredGames.map((game) => {
                  const gameBet = bets[game.id];
                  return (
                    <Card key={game.id} className="p-8 bg-card/40 backdrop-blur-3xl border-border/40 rounded-[40px] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 space-y-8">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-full px-3 py-1">
                            {game.isLive ? "Live Now" : "Upcoming"}
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {game.gameTime ? formatDistanceToNow(new Date(game.gameTime), { addSuffix: true }) : "TBA"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[game.team1, game.team2].map((team) => {
                            const odds = getOdds(game, team);
                            const active = gameBet?.team === team;
                            return (
                              <Button
                                key={team}
                                variant="ghost"
                                onClick={() => handleSelectTeam(game.id, team)}
                                className={`h-24 sm:h-32 flex flex-col gap-2 sm:gap-3 rounded-[24px] sm:rounded-[32px] border transition-all ${
                                  active ? "bg-primary border-primary text-primary-foreground scale-105 shadow-xl shadow-primary/20" : "bg-white/5 border-white/5 hover:bg-white/10"
                                }`}
                              >
                                <span className="text-base sm:text-lg font-black italic uppercase tracking-tight break-words px-2 text-center">{team}</span>
                                <Badge variant={active ? "secondary" : "outline"} className="text-[9px] font-black uppercase tracking-widest">{odds.toFixed(2)}x</Badge>
                              </Button>
                            );
                          })}
                        </div>

                        {(() => {
                          const analysis = getWinProbabilityFactors(game, standings, allGames);
                          if (!analysis) return null;
                          return (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/70">Factor Breakdown</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { label: "Ranking", team1: analysis.factors.ranking.team1Rank, team2: analysis.factors.ranking.team2Rank, icon: Trophy, key: 'ranking' },
                                  { label: "Record", team1: analysis.factors.record.team1Record, team2: analysis.factors.record.team2Record, icon: Target, key: 'record' },
                                  { label: "Point Diff", team1: (analysis.factors.pointDiff.team1PD > 0 ? "+" : "") + analysis.factors.pointDiff.team1PD, team2: (analysis.factors.pointDiff.team2PD > 0 ? "+" : "") + analysis.factors.pointDiff.team2PD, icon: BarChart3, key: 'pointDiff' },
                                  { label: "Schedule", team1: analysis.factors.schedule.team1SOS + "%", team2: analysis.factors.schedule.team2SOS + "%", icon: Zap, key: 'schedule' },
                                ].map((factor, i) => (
                                  <div key={i} className="bg-white/5 rounded-2xl p-3 flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 opacity-40">
                                      <factor.icon className="w-2.5 h-2.5" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">{factor.label}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black italic">
                                      <span className={analysis.factors[factor.key as keyof typeof analysis.factors].advantage === game.team1 ? "text-primary" : "text-white/60"}>
                                        {factor.team1}
                                      </span>
                                      <span className="text-white/10 not-italic mx-1">|</span>
                                      <span className={analysis.factors[factor.key as keyof typeof analysis.factors].advantage === game.team2 ? "text-primary" : "text-white/60"}>
                                        {factor.team2}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {gameBet && (
                          <div className="p-6 bg-primary/10 rounded-[32px] border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest text-primary">Wager Amount</label>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Winnings: {Math.floor(gameBet.amount * getOdds(game, gameBet.team))}</span>
                            </div>
                            <div className="flex gap-3">
                              <Input
                                type="number"
                                value={gameBet.amount}
                                onChange={(e) => handleAmountChange(game.id, e.target.value)}
                                className="h-12 bg-white/10 border-none rounded-2xl font-black text-xl tabular-nums"
                              />
                              <Button 
                                onClick={() => handlePlaceBet(game.id)}
                                disabled={placeBetMutation.isPending}
                                className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px]"
                              >
                                Lock It
                              </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {[10, 50, 100, 500].map(amt => (
                                <Button key={amt} variant="ghost" size="sm" onClick={() => handleQuickBet(game.id, amt)} className="h-8 rounded-xl bg-white/5 text-[9px] font-black tracking-widest">{amt}</Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-bets">
            <Card className="p-8 bg-card/40 backdrop-blur-3xl border-border/40 rounded-[40px]">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                Active Wagers
              </h3>
              <div className="space-y-4">
                {userBets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground font-medium italic">
                    No active bets found. Start wagering to see them here!
                  </div>
                ) : (
                  userBets.map((bet) => {
                    const game = allGames.find(g => g.id === bet.gameId);
                    return (
                      <div key={bet.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition-colors gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">
                              {bet.status}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {bet.createdAt ? new Date(bet.createdAt).toLocaleDateString() : 'Date TBA'}
                            </span>
                          </div>
                          <p className="text-lg font-black uppercase tracking-tight italic">
                            {game ? `${game.team1} vs ${game.team2}` : 'Unknown Matchup'}
                          </p>
                          <p className="text-sm font-medium text-muted-foreground">
                            Picked: <span className="text-foreground font-bold">{bet.pickedTeam}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Wager</p>
                            <div className="flex items-center gap-2 text-xl font-black italic text-foreground">
                              <Coins className="w-4 h-4 text-primary" />
                              {bet.amount.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">To Win</p>
                            <div className="flex items-center gap-2 text-xl font-black italic text-primary">
                              <Zap className="w-4 h-4" />
                              {Math.floor(bet.amount * (bet.multiplier ? bet.multiplier / 100 : (game ? calculateOdds(calculateWinProbability(game, bet.pickedTeam === game.team1 ? "team1" : "team2", standings, allGames)) : 1))).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
