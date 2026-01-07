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

  const { data: games = [] } = useQuery<GameResult[]>({
    queryKey: ["/api/games/all"],
  });

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

  // Get team stats from games
  const calculateTeamStats = (): TeamStats => {
    let wins = 0,
      losses = 0;
    let pointsFor = 0,
      pointsAgainst = 0;

    games.forEach((game) => {
      if (game.isFinal) {
        if (game.team1 === teamName) {
          pointsFor += game.team1Score ?? 0;
          pointsAgainst += game.team2Score ?? 0;
          if ((game.team1Score ?? 0) > (game.team2Score ?? 0)) wins++;
          else if ((game.team1Score ?? 0) < (game.team2Score ?? 0)) losses++;
        } else if (game.team2 === teamName) {
          pointsFor += game.team2Score ?? 0;
          pointsAgainst += game.team1Score ?? 0;
          if ((game.team2Score ?? 0) > (game.team1Score ?? 0)) wins++;
          else if ((game.team2Score ?? 0) < (game.team1Score ?? 0)) losses++;
        }
      }
    });

    return {
      wins,
      losses,
      pointDifferential: pointsFor - pointsAgainst,
    };
  };

  const teamStats = calculateTeamStats();

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
                    { label: "Wins", value: teamStats.wins, color: "text-primary" },
                    { label: "Losses", value: teamStats.losses, color: "text-destructive" },
                    { label: "Diff", value: `${teamStats.pointDifferential > 0 ? '+' : ''}${teamStats.pointDifferential}`, color: teamStats.pointDifferential >= 0 ? 'text-green-500' : 'text-red-500' },
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

        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8">
            {[
              { value: "roster", label: "Active Roster", icon: Users },
              { value: "stats", label: "Player Stats", icon: BarChart3 },
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

          <TabsContent value="roster" className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: "Quarterbacks", players: qbPlayers, icon: Zap },
                { label: "Running Backs", players: rbPlayers, icon: Target },
                { label: "Wide Receivers", players: wrPlayers, icon: BarChart3 },
                { label: "Defense", players: defPlayers, icon: Shield },
                { label: "Special Teams", players: kPlayers, icon: Footprints },
              ].filter(cat => cat.players.length > 0).map((cat, i) => (
                <Card key={i} className="p-8 bg-card/40 backdrop-blur-3xl border-border/40 rounded-[40px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                    <cat.icon className="w-24 h-24" />
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    {cat.label}
                  </h3>
                  <div className="space-y-4">
                    {cat.players.map((player) => (
                      <div key={player.id} className="flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors">
                        <div>
                          <p className="font-black uppercase tracking-tight">{player.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">#{player.number || '00'}</p>
                        </div>
                        <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-full">{player.position}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <Card className="p-8 bg-card/40 backdrop-blur-3xl border-border/40 rounded-[40px]">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                Player Analytics
              </h3>
              <div className="space-y-6">
                {teamRoster.filter(p => ["QB", "RB", "WR"].includes(p.position || "")).map((player) => {
                  const stats = player.stats;
                  const yards = (stats?.passingYards || 0) + (stats?.rushingYards || 0) + (stats?.receivingYards || 0);
                  const tds = (stats?.passingTouchdowns || 0) + (stats?.rushingTouchdowns || 0) + (stats?.receivingTouchdowns || 0);

                  return (
                    <div key={player.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 gap-6 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary italic">#{player.number || '00'}</div>
                        <div>
                          <p className="text-lg font-black uppercase tracking-tight">{player.name}</p>
                          <Badge variant="outline" className="p-0 border-none text-[10px] font-black text-muted-foreground uppercase tracking-widest">{player.position}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8 text-center flex-1 max-w-xs">
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total YDS</p>
                          <p className="text-2xl font-black italic tabular-nums">{yards}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total TDS</p>
                          <p className="text-2xl font-black italic tabular-nums text-primary">{tds}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
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
