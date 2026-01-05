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
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receivingYards: number;
  receivingTouchdowns: number;
  receptions: number;
  defensivePoints: number;
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

              {defPlayers.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Defense</h3>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Player</th>
                        <th className="px-4 py-2 text-right">Pass Yds</th>
                        <th className="px-4 py-2 text-right">Pass TD</th>
                        <th className="px-4 py-2 text-right">INT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {qbPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium text-white">{player.name}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.passingYards || 0}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.passingTouchdowns || 0}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.interceptions || 0}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {rbStats.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Running Back Stats</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Player</th>
                        <th className="px-4 py-2 text-right">Rush Yds</th>
                        <th className="px-4 py-2 text-right">Rush TD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rbPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium text-white">{player.name}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.rushingYards || 0}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.rushingTouchdowns || 0}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {wrStats.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Wide Receiver Stats</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Player</th>
                        <th className="px-4 py-2 text-right">Rec Yds</th>
                        <th className="px-4 py-2 text-right">Rec</th>
                        <th className="px-4 py-2 text-right">Rec TD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {wrPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium text-white">{player.name}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.receivingYards || 0}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.receptions || 0}</TableCell>
                          <TableCell className="text-gray-300">{player.stats?.receivingTouchdowns || 0}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
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
