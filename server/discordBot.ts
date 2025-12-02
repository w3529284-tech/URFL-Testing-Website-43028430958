
import { Client, GatewayIntentBits, Message, PartialMessage } from 'discord.js';
import { storage } from './storage';
import { TEAMS } from '../client/src/lib/teams';

// Map Discord emoji text to database team names
const DISCORD_EMOJI_TO_TEAM: Record<string, string> = {
  ':KansasCityChiefs:': 'Kansas City Chiefs',
  ':SanFrancisco49ers:': 'San Francisco 49ers',
  ':LosAngelesRams:': 'Los Angeles Rams',
  ':CAR~1:': 'Carolina Panthers',
  ':SEA~1:': 'Seattle Seahawks',
  ':TennesseeTitans:': 'Tennessee Titans',
  ':DAL~1:': 'Dallas Cowboys',
  ':IND~1:': 'Indianapolis Colts',
  ':BAL~1:': 'Baltimore Ravens',
  ':NewEnglandPatriots:': 'New England Patriots',
  ':BUF~1:': 'Buffalo Bills',
  ':CLE~1:': 'Cleveland Browns',
  ':PIT~1:': 'Pittsburgh Steelers',
  ':DEN~1:': 'Denver Broncos',
  ':HOU~1:': 'Houston Texans',
  ':LasVegasRaiders:': 'Las Vegas Raiders',
  ':MIN~1:': 'Minnesota Vikings',
  ':DET~1:': 'Detroit Lions',
  ':ATL~1:': 'Atlanta Falcons',
  ':NewYorkJets:': 'New York Jets',
  ':ARI~1:': 'Arizona Cardinals',
  ':NewOrleansSaints:': 'New Orleans Saints',
  ':PHI~1:': 'Philadelphia Eagles',
  ':NewYorkGiants:': 'New York Giants',
};

function parseTeamName(emojiText: string): string | null {
  // Try direct mapping first
  if (DISCORD_EMOJI_TO_TEAM[emojiText]) {
    return DISCORD_EMOJI_TO_TEAM[emojiText];
  }
  
  // Try to extract team name from emoji text (e.g., :TeamName: -> Team Name)
  const cleanName = emojiText.replace(/^:|:$/g, '').replace(/~\d+$/g, '');
  
  // Check if it matches any team name in TEAMS
  for (const teamName of Object.keys(TEAMS)) {
    if (teamName.replace(/\s+/g, '') === cleanName) {
      return teamName;
    }
  }
  
  return null;
}

function parseScheduleMessage(content: string): { week: number; games: Array<{ team1: string; team2: string }> } | null {
  // Extract week number from header like ":URFL: Regular Season Week 7 :URFL:"
  const weekMatch = content.match(/Week\s+(\d+)/i);
  if (!weekMatch) return null;
  
  const week = parseInt(weekMatch[1]);
  const games: Array<{ team1: string; team2: string }> = [];
  
  // Split by lines and find "vs." patterns
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for pattern: :Emoji: Team Name vs. :Emoji: Team Name
    if (line.includes(' vs. ')) {
      const parts = line.split(' vs. ');
      if (parts.length === 2) {
        // Extract team names from each side
        const team1Match = parts[0].match(/:([\w~]+):\s*(.+?)$/);
        const team2Match = parts[1].match(/:([\w~]+):\s*(.+?)$/);
        
        if (team1Match && team2Match) {
          const emoji1 = `:${team1Match[1]}:`;
          const emoji2 = `:${team2Match[1]}:`;
          
          const team1 = parseTeamName(emoji1) || team1Match[2].trim();
          const team2 = parseTeamName(emoji2) || team2Match[2].trim();
          
          games.push({ team1, team2 });
        }
      }
    }
  }
  
  if (games.length === 0) return null;
  
  return { week, games };
}

function parseScoreMessage(content: string): { team1: string; team2: string; team1Score: number; team2Score: number } | null {
  // Pattern: :TeamEmoji: Score - Score :TeamEmoji:
  const scorePattern = /:([\w~]+):\s*(\d+)\s*-\s*(\d+)\s*:([\w~]+):/;
  const match = content.match(scorePattern);
  
  if (!match) return null;
  
  const emoji1 = `:${match[1]}:`;
  const score1 = parseInt(match[2]);
  const score2 = parseInt(match[3]);
  const emoji2 = `:${match[4]}:`;
  
  const team1 = parseTeamName(emoji1);
  const team2 = parseTeamName(emoji2);
  
  if (!team1 || !team2) return null;
  
  return { team1, team2, team1Score: score1, team2Score: score2 };
}

function parseStandingsMessage(content: string): Array<{
  team: string;
  division: string;
  wins: number;
  losses: number;
  pointDifferential: number;
}> | null {
  const standings: Array<any> = [];
  
  let currentConference = '';
  let currentDivision = '';
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Detect conference
    if (line.includes(':AFC:')) {
      currentConference = 'AFC';
      continue;
    }
    if (line.includes(':NFC:')) {
      currentConference = 'NFC';
      continue;
    }
    
    // Detect division
    if (line.includes(':D1:')) {
      currentDivision = 'D1';
      continue;
    }
    if (line.includes(':D2:')) {
      currentDivision = 'D2';
      continue;
    }
    
    // Parse standings line: #1 :TeamEmoji: @Team Name W-L PD (+/-points)
    const standingPattern = /#\d+\s*:([\w~]+):\s*@?([\w\s]+?)\s+(\d+)-(\d+)\s+PD\s*\(([+-]?\d+)\)/;
    const match = line.match(standingPattern);
    
    if (match && currentConference && currentDivision) {
      const emoji = `:${match[1]}:`;
      const teamName = match[2].trim();
      const wins = parseInt(match[3]);
      const losses = parseInt(match[4]);
      const pd = parseInt(match[5]);
      
      const team = parseTeamName(emoji) || teamName;
      const division = `${currentConference}_${currentDivision}`;
      
      standings.push({
        team,
        division,
        wins,
        losses,
        pointDifferential: pd,
      });
    }
  }
  
  return standings.length > 0 ? standings : null;
}

export async function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const scheduleChannelId = process.env.DISCORD_SCHEDULE_CHANNEL_ID;
  const scoresChannelId = process.env.DISCORD_SCORES_CHANNEL_ID;
  const standingsChannelId = process.env.DISCORD_STANDINGS_CHANNEL_ID;
  
  if (!token) {
    console.log('Discord bot token not found. Skipping Discord bot initialization.');
    return;
  }
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
  
  client.on('clientReady', () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);
  });
  
  async function handleMessage(message: Message | PartialMessage) {
    if (message.author?.bot) return;
    if (!message.content) return;
    
    try {
      // Handle Schedule Messages
      if (scheduleChannelId && message.channelId === scheduleChannelId) {
        const parsed = parseScheduleMessage(message.content);
        if (parsed) {
          console.log(`Processing schedule for Week ${parsed.week} with ${parsed.games.length} games`);
          
          for (const game of parsed.games) {
            await storage.createGame({
              week: parsed.week,
              team1: game.team1,
              team2: game.team2,
              team1Score: 0,
              team2Score: 0,
              quarter: 'Scheduled',
              gameTime: null,
              isFinal: false,
              isLive: false,
            });
          }
          
          console.log(`✅ Created ${parsed.games.length} games for Week ${parsed.week}`);
        }
      }
      
      // Handle Score Messages
      if (scoresChannelId && message.channelId === scoresChannelId) {
        const parsed = parseScoreMessage(message.content);
        if (parsed) {
          console.log(`Processing score: ${parsed.team1} ${parsed.team1Score} - ${parsed.team2Score} ${parsed.team2}`);
          
          // Find matching game by teams
          const allGames = await storage.getAllGames();
          const game = allGames.find(g => 
            (g.team1 === parsed.team1 && g.team2 === parsed.team2) ||
            (g.team1 === parsed.team2 && g.team2 === parsed.team1)
          );
          
          if (game) {
            const isFlipped = game.team1 === parsed.team2;
            await storage.updateGame(game.id, {
              team1Score: isFlipped ? parsed.team2Score : parsed.team1Score,
              team2Score: isFlipped ? parsed.team1Score : parsed.team2Score,
              quarter: 'FINAL',
              isFinal: true,
              isLive: false,
            });
            
            console.log(`✅ Updated score for game ${game.id}`);
          }
        }
      }
      
      // Handle Standings Messages
      if (standingsChannelId && message.channelId === standingsChannelId) {
        const parsed = parseStandingsMessage(message.content);
        if (parsed) {
          console.log(`Processing standings with ${parsed.length} teams`);
          
          for (const standing of parsed) {
            await storage.upsertStandings(standing);
          }
          
          console.log(`✅ Updated standings for ${parsed.length} teams`);
        }
      }
    } catch (error) {
      console.error('Error processing Discord message:', error);
    }
  }
  
  client.on('messageCreate', handleMessage);
  client.on('messageUpdate', async (_oldMessage, newMessage) => {
    await handleMessage(newMessage);
  });
  
  await client.login(token);
}
