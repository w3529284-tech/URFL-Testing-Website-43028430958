import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TEAMS } from "@/lib/teams";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

import { Team, Player } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlayerStat {
  id: string;
  playerName: string;
  team: string;
  position: string;
  // QB
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  completions: number;
  attempts: number;
  sacks: number;
  // RB
  rushingYards: number;
  rushingTouchdowns: number;
  rushingAttempts: number;
  missedTacklesForced: number;
  // WR
  receivingYards: number;
  receivingTouchdowns: number;
  receptions: number;
  targets: number;
  yardsAfterCatch: number;
  // DB
  defensiveInterceptions: number;
  passesDefended: number;
  completionsAllowed: number;
  targetsAllowed: number;
  swats: number;
  defensiveTouchdowns: number;
  // DEF
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

export default function TeamDetail() {
  const [match, params] = useRoute("/teams/:name");

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

  const { data: playerStats = [] } = useQuery<PlayerStat[]>({
    queryKey: ["/api/player-stats"],
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
      return a.name.localeCompare(b.name);
    });

  // Helper for roster display mapping
  const getPlayersByPosition = (pos: string) => teamRoster.filter(p => p.position === pos);
  const qbPlayers = getPlayersByPosition("QB");
  const rbPlayers = getPlayersByPosition("RB");
  const wrPlayers = getPlayersByPosition("WR");
  const tePlayers = getPlayersByPosition("TE");
  const olPlayers = getPlayersByPosition("OL");
  const dlPlayers = getPlayersByPosition("DL");
  const lbPlayers = getPlayersByPosition("LB");
  const dbPlayers = getPlayersByPosition("DB");
  const kPlayers = getPlayersByPosition("K");
  const pPlayers = getPlayersByPosition("P");
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
          else losses++;
        } else if (game.team2 === teamName) {
          pointsFor += game.team2Score ?? 0;
          pointsAgainst += game.team1Score ?? 0;
          if ((game.team2Score ?? 0) > (game.team1Score ?? 0)) wins++;
          else losses++;
        }
      }
    });

    return {
      wins,
      losses,
      pointDifferential: pointsFor - pointsAgainst,
    };
  };

  // Get team recent games
  const getRecentGames = () => {
    return games
      .filter(
        (g) =>
          (g.team1 === teamName || g.team2 === teamName) && g.isFinal
      )
      .sort((a, b) => b.week - a.week)
      .slice(0, 10);
  };

  const teamStats = calculateTeamStats();
  const recentGames = getRecentGames();
  const qbStats = teamRoster.filter((p) => p.position === "QB");
  const rbStats = teamRoster.filter((p) => p.position === "RB");
  const wrStats = teamRoster.filter((p) => p.position === "WR");
  const teStats = teamRoster.filter((p) => p.position === "TE");
  const olStats = teamRoster.filter((p) => p.position === "OL");
  const dlStats = teamRoster.filter((p) => p.position === "DL");
  const lbStats = teamRoster.filter((p) => p.position === "LB");
  const dbStats = teamRoster.filter((p) => p.position === "DB");
  const kStats = teamRoster.filter((p) => p.position === "K");
  const pStats = teamRoster.filter((p) => p.position === "P");
  const defStats = teamRoster.filter((p) => p.position === "DEF");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/teams">
        <div className="flex items-center gap-2 text-primary mb-6 cursor-pointer hover:text-primary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Teams</span>
        </div>
      </Link>

      {/* Team Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="flex-shrink-0">
          {teamLogo && (
            <img
              src={teamLogo}
              alt={teamName}
              className="w-32 h-32 object-contain"
            />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-black mb-4">{teamName}</h1>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{teamStats.wins}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{teamStats.losses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </Card>
            <Card className="p-4 text-center">
              <p className={`text-3xl font-bold ${teamStats.pointDifferential >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {teamStats.pointDifferential > 0 ? '+' : ''}{teamStats.pointDifferential}
              </p>
              <p className="text-sm text-muted-foreground">Point Diff</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="stats">Player Stats</TabsTrigger>
          <TabsTrigger value="schedule">Recent Games</TabsTrigger>
        </TabsList>

        {/* Roster Tab */}
        <TabsContent value="roster" className="mt-6 space-y-6">
          {teamRoster.length > 0 ? (
            <>
              {qbPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Quarterbacks</h3>
                  <div className="space-y-2">
                    {qbPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">QB</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {rbPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Running Backs</h3>
                  <div className="space-y-2">
                    {rbPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">RB</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {wrPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Wide Receivers</h3>
                  <div className="space-y-2">
                    {wrPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">WR</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {tePlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Tight Ends</h3>
                  <div className="space-y-2">
                    {tePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">TE</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {olPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Offensive Line</h3>
                  <div className="space-y-2">
                    {olPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">OL</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {dlPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Defensive Line</h3>
                  <div className="space-y-2">
                    {dlPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">DL</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {lbPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Linebackers</h3>
                  <div className="space-y-2">
                    {lbPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">LB</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {dbPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Defensive Backs</h3>
                  <div className="space-y-2">
                    {dbPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">DB</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {kPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Kickers</h3>
                  <div className="space-y-2">
                    {kPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">K</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Punters</h3>
                  <div className="space-y-2">
                    {pPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">P</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {defPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Special Teams</h3>
                  <div className="space-y-2">
                    {defPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 border-b last:border-b-0"
                      >
                        <p className="font-semibold">{player.name} {player.number && <span className="text-muted-foreground ml-2">#{player.number}</span>}</p>
                        <p className="text-sm text-muted-foreground">DEF</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No roster data available</p>
            </Card>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <div className="space-y-6">
            {qbStats.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Quarterback Stats</h3>
                <div className="space-y-3">
                  {qbPlayers.map((player) => {
                    const stats = player.stats;
                    const attempts = stats?.attempts || 0;
                    const completions = stats?.completions || 0;
                    const yards = stats?.passingYards || 0;
                    const tds = stats?.passingTouchdowns || 0;
                    const ints = stats?.interceptions || 0;
                    const sacks = stats?.sacks || 0;

                    const compPct = attempts > 0 ? ((completions / attempts) * 100).toFixed(1) : "0.0";
                    const rating = attempts > 0 ? (
                      ((8.4 * yards) + (330 * tds) + (100 * completions) - (200 * ints)) / attempts
                    ).toFixed(1) : "0.0";

                    return (
                      <div key={player.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{player.name}</p>
                        </div>
                        <div className="flex-1 max-w-full ml-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                          <div className="min-w-[400px] border border-muted rounded-md overflow-hidden shadow-sm">
                            <div className="flex bg-muted/50 border-b border-muted">
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Pass Yds</div>
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Pass TD</div>
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none h-7 flex items-center justify-center">INT</div>
                            </div>
                            <div className="flex font-mono text-base bg-card">
                              <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none">{yards}</div>
                              <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none text-primary">{tds}</div>
                              <div className="flex-1 py-2 px-1 text-center font-black leading-none">{ints}</div>
                            </div>
                          </div>
                          <div className="flex justify-between mt-1.5 px-1 text-[10px] text-muted-foreground font-black uppercase tracking-tight min-w-[400px]">
                            <span>RTG: {rating}</span>
                            <span>{compPct}%</span>
                            <span>{completions}/{attempts}</span>
                            <span>SCK: {sacks}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {rbStats.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Running Back Stats</h3>
                <div className="space-y-3">
                  {rbPlayers.map((player) => {
                    const stats = player.stats;
                    const yards = stats?.rushingYards || 0;
                    const tds = stats?.rushingTouchdowns || 0;
                    const att = stats?.rushingAttempts || 0;
                    const misses = stats?.missedTacklesForced || 0;
                    const ypa = att > 0 ? (yards / att).toFixed(1) : "0.0";

                    return (
                      <div key={player.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{player.name}</p>
                        </div>
                        <div className="flex-1 max-w-full ml-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                          <div className="min-w-[400px] border border-muted rounded-md overflow-hidden shadow-sm">
                            <div className="flex bg-muted/50 border-b border-muted">
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Rush Yds</div>
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Rush TD</div>
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none h-7 flex items-center justify-center">Att</div>
                            </div>
                            <div className="flex font-mono text-base bg-card">
                              <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none">{yards}</div>
                              <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none text-primary">{tds}</div>
                              <div className="flex-1 py-2 px-1 text-center font-black leading-none">{att}</div>
                            </div>
                          </div>
                          <div className="flex justify-between mt-1.5 px-1 text-[10px] text-muted-foreground font-black uppercase tracking-tight min-w-[400px]">
                            <span>YPA: {ypa}</span>
                            <span>MISSES: {misses}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {wrStats.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Wide Receiver Stats</h3>
                <div className="space-y-3">
                  {wrPlayers.map((player) => {
                    const stats = player.stats;
                    const yards = stats?.receivingYards || 0;
                    const tds = stats?.receivingTouchdowns || 0;
                    const rec = stats?.receptions || 0;
                    const targets = stats?.targets || 0;
                    const yac = stats?.yardsAfterCatch || 0;
                    const catchPct = targets > 0 ? ((rec / targets) * 100).toFixed(1) : "0.0";

                    return (
                      <div key={player.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{player.name}</p>
                        </div>
                        <div className="flex-1 max-w-full ml-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                          <div className="min-w-[400px] border border-muted rounded-md overflow-hidden shadow-sm">
                            <div className="flex bg-muted/50 border-b border-muted">
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Rec Yds</div>
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Rec TD</div>
                              <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none h-7 flex items-center justify-center">Rec</div>
                            </div>
                            <div className="flex font-mono text-base bg-card">
                              <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none">{yards}</div>
                              <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none text-primary">{tds}</div>
                              <div className="flex-1 py-2 px-1 text-center font-black leading-none">{rec}</div>
                            </div>
                          </div>
                          <div className="flex justify-between mt-1.5 px-1 text-[10px] text-muted-foreground font-black uppercase tracking-tight min-w-[400px]">
                            <span>{rec}/{targets} TGT ({catchPct}%)</span>
                            <span>YAC: {yac}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {defStats.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Defense Stats</h3>
                <div className="space-y-3">
                  {defPlayers.map((player) => {
                    const stats = player.stats;
                    const scks = stats?.defensiveSacks || 0;
                    const tkls = stats?.tackles || 0;
                    const sftys = stats?.safeties || 0;
                    const misses = stats?.defensiveMisses || 0;
                    const ints = stats?.defensiveInterceptions || 0;
                    const swats = stats?.swats || 0;
                    const tds = stats?.defensiveTouchdowns || 0;
                    const targets = stats?.targetsAllowed || 0;
                    const comps = stats?.completionsAllowed || 0;
                    const denyPct = targets > 0 ? (((targets - comps) / targets) * 100).toFixed(1) : "0.0";

                    return (
                      <div key={player.id} className="pb-6 border-b last:border-b-0 space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{player.name}</p>
                          <div className="flex-1 max-w-full ml-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                            <div className="min-w-[400px] border border-muted rounded-md overflow-hidden shadow-sm">
                              <div className="flex bg-muted/50 border-b border-muted">
                                <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Sck</div>
                                <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Tkl</div>
                                <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none h-7 flex items-center justify-center">Sfty</div>
                              </div>
                              <div className="flex font-mono text-base bg-card">
                                <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none">{scks}</div>
                                <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none text-primary">{tkls}</div>
                                <div className="flex-1 py-2 px-1 text-center font-black leading-none">{sftys}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="w-1/4"></div>
                          <div className="flex-1 max-w-full ml-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                            <div className="min-w-[400px] border border-muted rounded-md overflow-hidden shadow-sm">
                              <div className="flex bg-muted/50 border-b border-muted">
                                <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Int</div>
                                <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none border-r border-muted h-7 flex items-center justify-center">Swat</div>
                                <div className="flex-1 py-1 px-1 text-[11px] font-black uppercase tracking-tight text-center leading-none h-7 flex items-center justify-center">TD</div>
                              </div>
                              <div className="flex font-mono text-base bg-card">
                                <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none">{ints}</div>
                                <div className="flex-1 py-2 px-1 text-center font-black border-r border-muted leading-none text-primary">{swats}</div>
                                <div className="flex-1 py-2 px-1 text-center font-black leading-none">{tds}</div>
                              </div>
                            </div>
                            <div className="flex justify-between mt-1.5 px-1 text-[10px] text-muted-foreground font-black uppercase tracking-tight min-w-[400px]">
                              <span>MISS: {misses}</span>
                              <span>DENY: {denyPct}%</span>
                              <span>CMP: {comps}/{targets}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <Card className="overflow-hidden">
            {recentGames.length > 0 ? (
              <div className="divide-y">
                {recentGames.map((game) => {
                  const isHome = game.team2 === teamName;
                  const opponent = isHome ? game.team1 : game.team2;
                  const teamScore = isHome ? game.team2Score : game.team1Score;
                  const oppScore = isHome ? game.team1Score : game.team2Score;
                  const won = (teamScore ?? 0) > (oppScore ?? 0);

                  return (
                    <div
                      key={game.id}
                      className="p-6 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            Week {game.week} · {isHome ? "Home" : "Away"}
                          </p>
                          <p className="font-semibold">{opponent}</p>
                        </div>
                        <div className="text-center">
                          <p
                            className={`text-3xl font-bold ${
                              won ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {won ? "W" : "L"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{teamScore}</p>
                          <p className="text-sm text-muted-foreground">
                            {oppScore}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No games played yet</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
