import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TEAMS } from "@/lib/teams";
import { ArrowLeft, Users, Trophy, Calendar, Target, Shield, Zap, BarChart3, Footprints } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Team, Player } from "@shared/schema";

export default function TeamDetail() {
  const [match, params] = useRoute("/teams/:name");
  const [, setLocation] = useLocation();

  if (!match) return null;

  const teamName = decodeURIComponent(params?.name || "");
  const teamLogo = TEAMS[teamName as keyof typeof TEAMS];

  const { data: teamPlayers = [] } = useQuery<(Player & { stats?: PlayerStat })[]>({
    queryKey: ["/api/teams", teamName, "players"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const allTeams: Team[] = await response.json();
      
      const currentTeam = allTeams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
      if (!currentTeam) return [];
      
      const [playersRes, statsRes] = await Promise.all([
        fetch(`/api/teams/${currentTeam.id}/players`),
        fetch("/api/player-stats")
      ]);
      
      if (!playersRes.ok) throw new Error("Failed to fetch players");
      if (!statsRes.ok) throw new Error("Failed to fetch stats");
      
      const players: Player[] = await playersRes.json();
      const stats: PlayerStat[] = await statsRes.json();
      
      return players.map(player => ({
        ...player,
        stats: stats.find(s => s.playerName === player.name)
      }));
    },
    enabled: !!teamName,
  });

  const { data: standings = [] } = useQuery<Standings[]>({
    queryKey: ["/api/standings"],
  });

  const teamStatsFromStandings = standings.find(s => s.team === teamName);

  // Get team roster from the new players table
  const teamRoster = (teamPlayers as (Player & { stats?: PlayerStat })[])
    .sort((a, b) => {
      const positionOrder = { QB: 0, RB: 1, WR: 2, DEF: 3 };
      const aOrder = positionOrder[a.position as keyof typeof positionOrder] || 999;
      const bOrder = positionOrder[b.position as keyof typeof positionOrder] || 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.name || "").localeCompare(b.name || "");
    });

  // Helper for roster display mapping
  const getPlayersByPosition = (pos: string) => teamRoster.filter(p => p.position === pos);
  const qbPlayers = getPlayersByPosition("QB");
  const rbPlayers = getPlayersByPosition("RB");
  const wrPlayers = getPlayersByPosition("WR");
  const kPlayers = getPlayersByPosition("K");
  const defPlayers = getPlayersByPosition("DEF");

  const { data: games = [] } = useQuery<GameResult[]>({
    queryKey: ["/api/games/all"],
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
        <Link href="/teams">
          <Button variant="ghost" className="group h-10 px-4 rounded-full font-black uppercase tracking-widest text-[10px] border border-border/40 bg-card/40 backdrop-blur-xl hover:bg-card/60 transition-all">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Teams
          </Button>
        </Link>

        {/* Team Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-1000" />
          <Card className="relative overflow-hidden border-none bg-card/40 backdrop-blur-3xl p-8 md:p-12 rounded-[40px]">
            <div className="grid lg:grid-cols-[auto,1fr] gap-12 items-center relative z-10">
              <div className="relative">
                <div className="absolute -inset-8 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
                {teamLogo && (
                  <img
                    src={teamLogo}
                    alt={teamName}
                    className="w-48 h-48 object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 text-[11px] font-black uppercase tracking-widest">
                    <Trophy className="w-3.5 h-3.5 mr-2" />
                    Season 2 Contender
                  </Badge>
                  <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] text-foreground">
                    {teamName}
                  </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: "Wins", value: teamStatsFromStandings?.wins || 0, color: "text-primary" },
                    { label: "Losses", value: teamStatsFromStandings?.losses || 0, color: "text-destructive" },
                    { label: "Diff", value: `${(teamStatsFromStandings?.pointDifferential || 0) > 0 ? '+' : ''}${teamStatsFromStandings?.pointDifferential || 0}`, color: (teamStatsFromStandings?.pointDifferential || 0) >= 0 ? 'text-green-500' : 'text-red-500' },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-4xl font-black italic tabular-nums ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8">
            {[
              { value: "schedule", label: "Recent History", icon: Calendar },
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

          <TabsContent value="schedule" className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {games
                .filter(g => g.team1 === teamName || g.team2 === teamName)
                .sort((a, b) => b.week - a.week)
                .map((game) => {
                  const isTeam1 = game.team1 === teamName;
                  const opponent = isTeam1 ? game.team2 : game.team1;
                  const teamScore = isTeam1 ? game.team1Score : game.team2Score;
                  const opponentScore = isTeam1 ? game.team2Score : game.team1Score;
                  const isWinner = teamScore! > opponentScore!;
                  const isDraw = teamScore === opponentScore;

                  return (
                    <Card key={game.id} className="p-8 bg-card/40 backdrop-blur-3xl border-border/40 rounded-[40px] relative overflow-hidden group">
                      <div className="relative z-10 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="relative w-16 h-16 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
                            {TEAMS[opponent as keyof typeof TEAMS] ? (
                              <img src={TEAMS[opponent as keyof typeof TEAMS]} alt={opponent} className="w-10 h-10 object-contain" />
                            ) : (
                              <Trophy className="w-6 h-6 text-muted-foreground/20" />
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Week {game.week} vs</p>
                            <h4 className="text-xl font-black italic uppercase tracking-tighter">{opponent}</h4>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={`px-3 py-1 rounded-full font-black uppercase tracking-widest text-[9px] ${
                            !game.isFinal ? 'bg-white/10 text-muted-foreground' :
                            isWinner ? 'bg-primary/20 text-primary' : 
                            isDraw ? 'bg-white/10 text-white' : 'bg-destructive/20 text-destructive'
                          }`}>
                            {!game.isFinal ? 'Scheduled' : isWinner ? 'Winner' : isDraw ? 'Draw' : 'Loss'}
                          </Badge>
                          <p className="text-2xl font-black italic tabular-nums">
                            {teamScore} - {opponentScore}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              {games.filter(g => g.team1 === teamName || g.team2 === teamName).length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <Calendar className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                  <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No game history found for this team</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface PlayerStat {
  id: string;
  playerName: string;
  team: string;
  position: string;
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  completions: number;
  attempts: number;
  sacks: number;
  rushingYards: number;
  rushingTouchdowns: number;
  rushingAttempts: number;
  missedTacklesForced: number;
  receivingYards: number;
  receivingTouchdowns: number;
  receptions: number;
  targets: number;
  yardsAfterCatch: number;
  defensiveInterceptions: number;
  passesDefended: number;
  completionsAllowed: number;
  targetsAllowed: number;
  swats: number;
  defensiveTouchdowns: number;
  defensiveSacks: number;
  tackles: number;
  defensiveMisses: number;
  safeties: number;
  defensivePoints: number;
  week: number;
}

interface GameResult {
  id: string;
  team1: string;
  team2: string;
  team1Score: number;
  team2Score: number;
  isFinal: boolean;
  week: number;
}

interface TeamStats {
  wins: number;
  losses: number;
  pointDifferential: number;
}
