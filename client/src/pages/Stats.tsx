import { Team, Player } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TEAMS } from "@/lib/teams";

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
  week: number;
}

interface TeamStats {
  team: string;
  pointsFor: number;
  pointsAgainst: number;
}

export default function Stats() {
  const { data: playerStats = [] } = useQuery<PlayerStat[]>({
    queryKey: ["/api/player-stats"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: gameStats = [] } = useQuery<any[]>({
    queryKey: ["/api/games/all"],
  });

  // Aggregated roster data from players table
  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/all-players"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) return [];
      const teams: Team[] = await response.json();
      const playersPromises = teams.map(t => fetch(`/api/teams/${t.id}/players`).then(res => res.json()));
      const playersArrays = await Promise.all(playersPromises);
      return playersArrays.flat();
    }
  });

  // Aggregate team stats from games
  const calculateTeamStats = (): TeamStats[] => {
    const teamMap = new Map<string, { pointsFor: number; pointsAgainst: number }>();

    gameStats.forEach((game) => {
      if (game.isFinal) {
        if (!teamMap.has(game.team1)) {
          teamMap.set(game.team1, { pointsFor: 0, pointsAgainst: 0 });
        }
        if (!teamMap.has(game.team2)) {
          teamMap.set(game.team2, { pointsFor: 0, pointsAgainst: 0 });
        }

        const team1Stats = teamMap.get(game.team1)!;
        const team2Stats = teamMap.get(game.team2)!;

        team1Stats.pointsFor += game.team1Score;
        team1Stats.pointsAgainst += game.team2Score;
        team2Stats.pointsFor += game.team2Score;
        team2Stats.pointsAgainst += game.team1Score;
      }
    });

    return Array.from(teamMap, ([team, stats]) => ({
      team,
      ...stats,
    }));
  };

  // Get player leaderboards by position
  const getLeaderboard = (position: string) => {
    return playerStats
      .filter((p) => p.position === position)
      .sort((a, b) => {
        if (position === "QB") {
          return b.passingYards - a.passingYards;
        } else if (position === "RB") {
          return b.rushingYards - a.rushingYards;
        } else if (position === "WR") {
          return b.receivingYards - a.receivingYards;
        } else if (position === "DEF") {
          return b.defensivePoints - a.defensivePoints;
        }
        return 0;
      })
      .slice(0, 10);
  };

  const teamStats = calculateTeamStats();
  const offenseRankings = [...teamStats].sort((a, b) => b.pointsFor - a.pointsFor);
  const defenseRankings = [...teamStats].sort((a, b) => a.pointsAgainst - b.pointsAgainst);

  const recordBook = {
    mostQBPoints: playerStats
      .filter((p) => p.position === "QB")
      .sort((a, b) => (b.passingYards + b.passingTouchdowns * 6) - (a.passingYards + a.passingTouchdowns * 6))
      .slice(0, 5),
    mostRBPoints: playerStats
      .filter((p) => p.position === "RB")
      .sort((a, b) => (b.rushingYards + b.rushingTouchdowns * 6) - (a.rushingYards + a.rushingTouchdowns * 6))
      .slice(0, 5),
    mostWRPoints: playerStats
      .filter((p) => p.position === "WR")
      .sort((a, b) => (b.receivingYards + b.receivingTouchdowns * 6) - (a.receivingYards + a.receivingTouchdowns * 6))
      .slice(0, 5),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Stats & Data</h1>
        <p className="text-muted-foreground text-lg">Season Statistics and Rankings</p>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard">Player Leaders</TabsTrigger>
          <TabsTrigger value="offense">Offense</TabsTrigger>
          <TabsTrigger value="defense">Defense</TabsTrigger>
          <TabsTrigger value="records">Record Book</TabsTrigger>
        </TabsList>

        {/* Player Leaderboards */}
        <TabsContent value="leaderboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QB Leaders */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Quarterback Leaders</h3>
              <div className="space-y-3">
                {getLeaderboard("QB").length > 0 ? (
                  getLeaderboard("QB").map((player, idx) => (
                    <div key={player.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</span>
                        <div>
                          <p className="font-semibold">{player.playerName}</p>
                          <p className="text-sm text-muted-foreground">{player.team}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{player.passingYards} yds</p>
                        <p className="text-sm text-muted-foreground">{player.passingTouchdowns} TD</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No QB stats yet</p>
                )}
              </div>
            </Card>

            {/* WR Leaders */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Wide Receiver Leaders</h3>
              <div className="space-y-3">
                {getLeaderboard("WR").length > 0 ? (
                  getLeaderboard("WR").map((player, idx) => (
                    <div key={player.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</span>
                        <div>
                          <p className="font-semibold">{player.playerName}</p>
                          <p className="text-sm text-muted-foreground">{player.team}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{player.receivingYards} yds</p>
                        <p className="text-sm text-muted-foreground">{player.receptions} rec</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No WR stats yet</p>
                )}
              </div>
            </Card>

            {/* RB Leaders */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Running Back Leaders</h3>
              <div className="space-y-3">
                {getLeaderboard("RB").length > 0 ? (
                  getLeaderboard("RB").map((player, idx) => (
                    <div key={player.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</span>
                        <div>
                          <p className="font-semibold">{player.playerName}</p>
                          <p className="text-sm text-muted-foreground">{player.team}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{player.rushingYards} yds</p>
                        <p className="text-sm text-muted-foreground">{player.rushingTouchdowns} TD</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No RB stats yet</p>
                )}
              </div>
            </Card>

            {/* DEF Leaders */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Defense Leaders</h3>
              <div className="space-y-3">
                {getLeaderboard("DEF").length > 0 ? (
                  getLeaderboard("DEF").map((player, idx) => (
                    <div key={player.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</span>
                        <div>
                          <p className="font-semibold">{player.playerName}</p>
                          <p className="text-sm text-muted-foreground">{player.team}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{player.defensivePoints} pts</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No DEF stats yet</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Team Offense Rankings */}
        <TabsContent value="offense" className="mt-6">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-6">Team Offense Rankings (Points Scored)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Team</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Points For</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {offenseRankings.length > 0 ? (
                    offenseRankings.map((team, idx) => (
                      <tr key={team.team} className="hover:bg-accent/10 transition-colors">
                        <td className="px-4 py-4 text-sm font-bold">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-semibold">
                          <div className="flex items-center gap-3">
                            {TEAMS[team.team as keyof typeof TEAMS] && (
                              <img
                                src={TEAMS[team.team as keyof typeof TEAMS]}
                                alt={team.team}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <span>{team.team}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-right font-bold">{team.pointsFor}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No game data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Team Defense Rankings */}
        <TabsContent value="defense" className="mt-6">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-6">Team Defense Rankings (Points Allowed)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Team</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Points Allowed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {defenseRankings.length > 0 ? (
                    defenseRankings.map((team, idx) => (
                      <tr key={team.team} className="hover:bg-accent/10 transition-colors">
                        <td className="px-4 py-4 text-sm font-bold">{idx + 1}</td>
                        <td className="px-4 py-4 text-sm font-semibold">
                          <div className="flex items-center gap-3">
                            {TEAMS[team.team as keyof typeof TEAMS] && (
                              <img
                                src={TEAMS[team.team as keyof typeof TEAMS]}
                                alt={team.team}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <span>{team.team}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-right font-bold">{team.pointsAgainst}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No game data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Record Book */}
        <TabsContent value="records" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">QB Record Book</h3>
              <div className="space-y-3">
                {recordBook.mostQBPoints.length > 0 ? (
                  recordBook.mostQBPoints.map((player, idx) => (
                    <div key={player.id} className="pb-3 border-b last:border-b-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold">{player.playerName}</p>
                        <span className="text-sm font-bold text-primary">
                          {Math.round((player.passingYards + player.passingTouchdowns * 6) / 10) * 10} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{player.team}</p>
                      <p className="text-xs text-muted-foreground">{player.passingYards} yds, {player.passingTouchdowns} TD</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No records yet</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">RB Record Book</h3>
              <div className="space-y-3">
                {recordBook.mostRBPoints.length > 0 ? (
                  recordBook.mostRBPoints.map((player, idx) => (
                    <div key={player.id} className="pb-3 border-b last:border-b-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold">{player.playerName}</p>
                        <span className="text-sm font-bold text-primary">
                          {Math.round((player.rushingYards + player.rushingTouchdowns * 6) / 10) * 10} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{player.team}</p>
                      <p className="text-xs text-muted-foreground">{player.rushingYards} yds, {player.rushingTouchdowns} TD</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No records yet</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">WR Record Book</h3>
              <div className="space-y-3">
                {recordBook.mostWRPoints.length > 0 ? (
                  recordBook.mostWRPoints.map((player, idx) => (
                    <div key={player.id} className="pb-3 border-b last:border-b-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold">{player.playerName}</p>
                        <span className="text-sm font-bold text-primary">
                          {Math.round((player.receivingYards + player.receivingTouchdowns * 6) / 10) * 10} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{player.team}</p>
                      <p className="text-xs text-muted-foreground">{player.receivingYards} yds, {player.receivingTouchdowns} TD</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No records yet</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
