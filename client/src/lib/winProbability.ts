import type { Game, Standings } from "@shared/schema";

/**
 * Calculate win probability for a team based on multiple factors:
 * - Rankings (derived from standings order)
 * - Point Differential
 * - Schedule Strength (quality of opponents faced)
 * - Win/Loss Record
 * - Current score (during live games)
 * - Quarter progress (game momentum)
 */

interface TeamAnalysis {
  ranking: number;
  winPercentage: number;
  pointDifferential: number;
  scheduleStrength: number;
  totalGamesPlayed: number;
}

function calculateRankings(standings: Standings[]): Map<string, number> {
  const rankings = new Map<string, number>();

  const sortedStandings = [...standings].sort((a, b) => {
    if (a.manualOrder !== null && b.manualOrder !== null && 
        a.manualOrder !== undefined && b.manualOrder !== undefined) {
      return a.manualOrder - b.manualOrder;
    }

    const aWins = a.wins || 0;
    const bWins = b.wins || 0;
    const aLosses = a.losses || 0;
    const bLosses = b.losses || 0;

    const aWinPct = aWins + aLosses > 0 ? aWins / (aWins + aLosses) : 0;
    const bWinPct = bWins + bLosses > 0 ? bWins / (bWins + bLosses) : 0;

    if (bWinPct !== aWinPct) return bWinPct - aWinPct;

    const aPD = a.pointDifferential || 0;
    const bPD = b.pointDifferential || 0;
    return bPD - aPD;
  });

  sortedStandings.forEach((standing, index) => {
    rankings.set(standing.team, index + 1);
  });

  return rankings;
}

function calculateScheduleStrength(
  teamName: string,
  games: Game[],
  standings: Standings[]
): number {
  const completedGames = games.filter(
    g => g.isFinal && (g.team1 === teamName || g.team2 === teamName)
  );
  
  if (completedGames.length === 0) return 0.5;
  
  let totalOpponentWinPct = 0;
  
  completedGames.forEach(game => {
    const opponent = game.team1 === teamName ? game.team2 : game.team1;
    const opponentStanding = standings.find(s => s.team === opponent);
    
    if (opponentStanding) {
      const wins = opponentStanding.wins || 0;
      const losses = opponentStanding.losses || 0;
      const totalGames = wins + losses;
      
      if (totalGames > 0) {
        totalOpponentWinPct += wins / totalGames;
      } else {
        totalOpponentWinPct += 0.5;
      }
    } else {
      totalOpponentWinPct += 0.5;
    }
  });
  
  return totalOpponentWinPct / completedGames.length;
}

function analyzeTeam(
  teamName: string,
  standings: Standings[],
  games: Game[],
  rankings: Map<string, number>
): TeamAnalysis {
  const standing = standings.find(s => s.team === teamName);
  const wins = standing?.wins || 0;
  const losses = standing?.losses || 0;
  const totalGames = wins + losses;

  return {
    ranking: rankings.get(teamName) || standings.length,
    winPercentage: totalGames > 0 ? wins / totalGames : 0.5,
    pointDifferential: standing?.pointDifferential || 0,
    scheduleStrength: calculateScheduleStrength(teamName, games, standings),
    totalGamesPlayed: totalGames
  };
}

export function calculateWinProbability(
  game: Game,
  team: "team1" | "team2",
  standings?: Standings[],
  allGames?: Game[]
): number {
  if (!standings || standings.length === 0) {
    return 50;
  }

  const games = allGames || [];
  const rankings = calculateRankings(standings);

  const team1Analysis = analyzeTeam(game.team1, standings, games, rankings);
  const team2Analysis = analyzeTeam(game.team2, standings, games, rankings);

  let probability = 50;

  const totalTeams = standings.length;
  const team1RankScore = (totalTeams - team1Analysis.ranking + 1) / totalTeams;
  const team2RankScore = (totalTeams - team2Analysis.ranking + 1) / totalTeams;
  const rankingDiff = team1RankScore - team2RankScore;
  // Increased from 20 to 40 for more significant impact
  const rankingImpact = rankingDiff * 40;

  const pdDifference = team1Analysis.pointDifferential - team2Analysis.pointDifferential;
  // Increased PD impact range
  const cappedPdDiff = Math.max(-200, Math.min(200, pdDifference));
  const pdImpact = (cappedPdDiff / 30) * 25;

  const winPctDiff = team1Analysis.winPercentage - team2Analysis.winPercentage;
  // Increased from 25 to 50 for more realistic probabilities
  const recordImpact = winPctDiff * 50;

  const team1SOS = team1Analysis.scheduleStrength;
  const team2SOS = team2Analysis.scheduleStrength;

  // Only apply SOS adjustment if both teams have played games
  let sosImpact = 0;
  if (team1SOS >= 0 && team2SOS >= 0) {
    const sosDiff = team1SOS - team2SOS;
    // Increased impact from 10 to 20
    sosImpact = sosDiff * 20;
  }

  const hasGames1 = team1Analysis.totalGamesPlayed > 0;
  const hasGames2 = team2Analysis.totalGamesPlayed > 0;

  if (hasGames1 && hasGames2) {
    // Stronger overall impact
    probability += rankingImpact * 0.40;
    probability += recordImpact * 0.35;
    probability += pdImpact * 0.25;
    probability += sosImpact * 0.30;
  } else if (hasGames1 || hasGames2) {
    probability += rankingImpact * 0.50;
    probability += pdImpact * 0.40;
    probability += recordImpact * 0.40;
  } else {
    probability += rankingImpact * 0.70;
    probability += pdImpact * 0.50;
  }

  if (game.quarter && game.quarter !== "Scheduled") {
    const scoreDifference = (game.team1Score || 0) - (game.team2Score || 0);

    const quarterMap: { [key: string]: number } = {
      "1st": 0.25,
      "2nd": 0.45,
      "3rd": 0.7,
      "4th": 0.9,
      "OT": 0.95,
      "Q1": 0.25,
      "Q2": 0.45,
      "Q3": 0.7,
      "Q4": 0.9,
    };

    const quarterWeight = quarterMap[game.quarter] || 0.5;

    // Calculate score impact - moderate sensitivity
    const baseScoreImpact = (scoreDifference / 7) * 10;
    
    // Slight boost for significant leads (>21 points)
    const blowoutMultiplier = Math.abs(scoreDifference) > 21 ? 1.3 : 1.0;
    const scoreImpact = baseScoreImpact * blowoutMultiplier;

    // Moderate quarter weight adjustment for large score differentials
    let adjustedQuarterWeight = quarterWeight;
    if (Math.abs(scoreDifference) > 35) {
      adjustedQuarterWeight = Math.min(0.75, quarterWeight + 0.2);
    } else if (Math.abs(scoreDifference) > 28) {
      adjustedQuarterWeight = Math.min(0.65, quarterWeight + 0.15);
    } else if (Math.abs(scoreDifference) > 21) {
      adjustedQuarterWeight = Math.min(0.60, quarterWeight + 0.1);
    }

    const preGameWeight = 1 - adjustedQuarterWeight;
    probability = (probability * preGameWeight) + (50 + scoreImpact) * adjustedQuarterWeight;
  }

  // Keep probabilities between 1-99% to avoid absolute certainties
  probability = Math.max(1, Math.min(99, Math.round(probability)));

  // If we are in the browser, update the server's view of the odds via an internal API call if needed
  // However, we'll just return the value and let the UI handle the display.
  // The backend resolution will need to recalculate this.

  if (team === "team1") {
    return probability;
  } else {
    return 100 - probability;
  }
}

export function calculateOdds(probability: number): number {
  // Formula: 100 / probability
  // Capped between 1.1x and 10x
  const rawOdds = 100 / Math.max(probability, 1);
  // Ensure we round to 2 decimal places to match display and user expectations
  return Math.max(1.1, Math.min(10, Math.round(rawOdds * 100) / 100));
}


export function getConferenceRanking(teamName: string, standings?: Standings[]): string {
  if (!standings || standings.length === 0) {
    return "N/A";
  }

  const teamStanding = standings.find(s => s.team === teamName);
  if (!teamStanding) {
    return "N/A";
  }

  const conference = teamStanding.division.startsWith("AFC") ? "AFC" : "NFC";
  const conferenceTeams = standings.filter(s => s.division.startsWith(conference));

  const sortedTeams = [...conferenceTeams].sort((a, b) => {
    if (a.manualOrder !== null && b.manualOrder !== null && 
        a.manualOrder !== undefined && b.manualOrder !== undefined) {
      return a.manualOrder - b.manualOrder;
    }

    const aWins = a.wins || 0;
    const bWins = b.wins || 0;
    const aLosses = a.losses || 0;
    const bLosses = b.losses || 0;

    const aWinPct = aWins + aLosses > 0 ? aWins / (aWins + aLosses) : 0;
    const bWinPct = bWins + bLosses > 0 ? bWins / (bWins + bLosses) : 0;

    if (bWinPct !== aWinPct) return bWinPct - aWinPct;

    const aPD = a.pointDifferential || 0;
    const bPD = b.pointDifferential || 0;
    return bPD - aPD;
  });

  const rank = sortedTeams.findIndex(s => s.team === teamName) + 1;
  const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const ordinal = ordinals[rank - 1] || `${rank}th`;

  return `${ordinal} in ${conference}`;
}

export function getWinProbabilityFactors(
  game: Game,
  standings?: Standings[],
  allGames?: Game[]
): {
  team1: TeamAnalysis;
  team2: TeamAnalysis;
  factors: {
    ranking: { team1Rank: string; team2Rank: string; advantage: string };
    record: { team1Record: string; team2Record: string; advantage: string };
    pointDiff: { team1PD: number; team2PD: number; advantage: string };
    schedule: { team1SOS: number; team2SOS: number; advantage: string };
  };
} | null {
  if (!standings || standings.length === 0) {
    return null;
  }

  const games = allGames || [];
  const rankings = calculateRankings(standings);

  const team1Analysis = analyzeTeam(game.team1, standings, games, rankings);
  const team2Analysis = analyzeTeam(game.team2, standings, games, rankings);

  const standing1 = standings.find(s => s.team === game.team1);
  const standing2 = standings.find(s => s.team === game.team2);

  const team1RankStr = getConferenceRanking(game.team1, standings);
  const team2RankStr = getConferenceRanking(game.team2, standings);

  return {
    team1: team1Analysis,
    team2: team2Analysis,
    factors: {
      ranking: {
        team1Rank: team1RankStr,
        team2Rank: team2RankStr,
        advantage: team1Analysis.ranking < team2Analysis.ranking ? game.team1 :
                   team2Analysis.ranking < team1Analysis.ranking ? game.team2 : "Even"
      },
      record: {
        team1Record: `${standing1?.wins || 0}-${standing1?.losses || 0}`,
        team2Record: `${standing2?.wins || 0}-${standing2?.losses || 0}`,
        advantage: team1Analysis.winPercentage > team2Analysis.winPercentage ? game.team1 :
                   team2Analysis.winPercentage > team1Analysis.winPercentage ? game.team2 : "Even"
      },
      pointDiff: {
        team1PD: team1Analysis.pointDifferential,
        team2PD: team2Analysis.pointDifferential,
        advantage: team1Analysis.pointDifferential > team2Analysis.pointDifferential ? game.team1 :
                   team2Analysis.pointDifferential > team1Analysis.pointDifferential ? game.team2 : "Even"
      },
      schedule: (() => {
        if (team1Analysis.scheduleStrength < 0 || team2Analysis.scheduleStrength < 0) {
          return {
            team1SOS: -1,
            team2SOS: -1,
            advantage: "Even"
          };
        }
        
        const totalSOS = team1Analysis.scheduleStrength + team2Analysis.scheduleStrength;
        const team1SOS = totalSOS > 0 ? Math.round((team1Analysis.scheduleStrength / totalSOS) * 100) : 50;
        const team2SOS = totalSOS > 0 ? Math.round((team2Analysis.scheduleStrength / totalSOS) * 100) : 50;
        
        return {
          team1SOS,
          team2SOS,
          advantage: team1Analysis.scheduleStrength > team2Analysis.scheduleStrength ? game.team1 :
                     team2Analysis.scheduleStrength > team1Analysis.scheduleStrength ? game.team2 : "Even"
        };
      })()
    }
  };
}