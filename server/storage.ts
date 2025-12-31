import {
  users,
  games,
  news,
  chatMessages,
  pickems,
  pickemRules,
  standings,
  playoffMatches,
  changelogs,
  predictions,
  bracketImages,
  streamRequests,
  settings,
  partners,
  userPreferences,
  updatePlans,
  bets,
  parlays,
  playerStats,
  type User,
  type UpsertUser,
  type Game,
  type InsertGame,
  type News,
  type InsertNews,
  type ChatMessage,
  type InsertChatMessage,
  type Pickem,
  type InsertPickem,
  type PickemRules,
  type InsertPickemRules,
  type Standings,
  type InsertStandings,
  type PlayoffMatch,
  type InsertPlayoffMatch,
  type Changelog,
  type InsertChangelog,
  type Prediction,
  type InsertPrediction,
  type BracketImage,
  type InsertBracketImage,
  type StreamRequest,
  type InsertStreamRequest,
  type Settings,
  type InsertSettings,
  type Partner,
  type InsertPartners,
  type UserPreference,
  type InsertUserPreferences,
  type UpdatePlan,
  type InsertUpdatePlan,
  type Bet,
  type InsertBet,
  type Parlay,
  type InsertParlay,
  type PlayerStats,
  type InsertPlayerStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllGames(): Promise<Game[]>;
  getGamesByWeek(week: number): Promise<Game[]>;
  getCurrentWeekGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<Game>): Promise<Game>;
  deleteGame(id: string): Promise<void>;
  
  getAllNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  deleteNews(id: string): Promise<void>;
  
  getChatMessages(gameId?: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  getAllPickems(): Promise<Pickem[]>;
  getPickemByWeek(week: number): Promise<Pickem | undefined>;
  createPickem(pickem: InsertPickem): Promise<Pickem>;
  deletePickem(id: string): Promise<void>;
  
  getPickemRules(): Promise<PickemRules | undefined>;
  upsertPickemRules(rules: InsertPickemRules): Promise<PickemRules>;
  
  getAllStandings(): Promise<Standings[]>;
  upsertStandings(standing: InsertStandings): Promise<Standings>;
  deleteStandings(id: string): Promise<void>;
  
  getAllPlayoffMatches(): Promise<PlayoffMatch[]>;
  getPlayoffMatchesByRound(round: string): Promise<PlayoffMatch[]>;
  createPlayoffMatch(match: InsertPlayoffMatch): Promise<PlayoffMatch>;
  updatePlayoffMatch(id: string, match: Partial<PlayoffMatch>): Promise<PlayoffMatch>;
  deletePlayoffMatch(id: string): Promise<void>;
  
  getAllChangelogs(): Promise<Changelog[]>;
  createChangelog(changelog: InsertChangelog): Promise<Changelog>;
  deleteChangelog(id: string): Promise<void>;
  
  getPredictionsByGameId(gameId: string): Promise<Prediction[]>;
  getUserPredictionForGame(userId: string, gameId: string): Promise<Prediction | undefined>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  
  getBracketImage(): Promise<BracketImage | undefined>;
  upsertBracketImage(image: InsertBracketImage): Promise<BracketImage>;
  
  getAllStreamRequests(): Promise<StreamRequest[]>;
  getStreamRequestsByUser(userId: string): Promise<StreamRequest[]>;
  getStreamRequestsByGame(gameId: string): Promise<StreamRequest[]>;
  createStreamRequest(request: InsertStreamRequest): Promise<StreamRequest>;
  updateStreamRequest(id: string, request: Partial<StreamRequest>): Promise<StreamRequest>;
  deleteStreamRequest(id: string): Promise<void>;
  
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserTourStatus(id: string, completed: boolean): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUserWithPassword(username: string, password: string, role: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  getAllPartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartners): Promise<Partner>;
  updatePartner(id: string, partner: Partial<Partner>): Promise<Partner>;
  deletePartner(id: string): Promise<void>;

  getUserPreferences(userId: string): Promise<UserPreference | undefined>;
  updateUserPreferences(userId: string, prefs: InsertUserPreferences): Promise<UserPreference>;

  getAllUpdatePlans(): Promise<UpdatePlan[]>;
  getUpdatePlans(year: number): Promise<UpdatePlan[]>;
  upsertUpdatePlan(plan: InsertUpdatePlan): Promise<UpdatePlan>;
  deleteUpdatePlan(id: string): Promise<void>;

  getUserBets(userId: string): Promise<Bet[]>;
  placeBet(bet: InsertBet): Promise<Bet>;
  getUserBalance(userId: string): Promise<number>;
  updateUserBalance(userId: string, amount: number): Promise<User>;
}

// Helper function to convert undefined to null (postgres requires explicit null, not undefined)
function cleanObject(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanObject(value);
    }
    return cleaned;
  }
  
  return obj;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const cleanData = cleanObject(userData);
    
    // If id is null/undefined, remove it so PostgreSQL uses the default gen_random_uuid()
    if (cleanData.id === null || cleanData.id === undefined) {
      delete cleanData.id;
    }
    
    // If no id, just insert (let DB generate id)
    if (!cleanData.id) {
      const [user] = await db
        .insert(users)
        .values(cleanData as UpsertUser)
        .returning();
      return user;
    }
    
    // With id, use upsert
    const [user] = await db
      .insert(users)
      .values(cleanData as UpsertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: cleanData,
      })
      .returning();
    return user;
  }

  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(games.gameTime);
  }

  async getGamesByWeek(week: number): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.week, week))
      .orderBy(games.gameTime);
  }

  async getCurrentWeekGames(): Promise<Game[]> {
    const allGames = await db.select().from(games).orderBy(desc(games.week));
    if (allGames.length === 0) return [];
    
    const currentWeek = allGames[0].week;
    return allGames.filter(g => g.week === currentWeek);
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(gameData: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(cleanObject(gameData) as InsertGame).returning();
    return game;
  }

  async updateGame(id: string, gameData: Partial<Game>): Promise<Game> {
    const updateData = cleanObject(gameData);
    if (updateData.gameTime && typeof updateData.gameTime === 'string') {
      updateData.gameTime = new Date(updateData.gameTime);
    }
    
    // Map camelCase to snake_case if Drizzle isn't picking it up from the set() call automatically
    // The games table has "ball_position" column mapped to "ballPosition" in schema.ts
    // We'll explicitly handle both just in case
    const finalUpdate: any = { ...updateData };
    
    if (gameData.ballPosition !== undefined) {
      finalUpdate.ballPosition = Number(gameData.ballPosition);
    }
    if ((gameData as any).ball_position !== undefined) {
      finalUpdate.ballPosition = Number((gameData as any).ball_position);
    }

    const [game] = await db
      .update(games)
      .set(finalUpdate)
      .where(eq(games.id, id))
      .returning();
      
    console.log(`[STORAGE] Game ${id} updated in DB. New ballPosition: ${game.ballPosition}`);
    return game;
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  async getAllNews(): Promise<News[]> {
    return await db.select().from(news).orderBy(desc(news.createdAt));
  }

  async createNews(newsData: InsertNews): Promise<News> {
    const [newsItem] = await db.insert(news).values(cleanObject(newsData) as InsertNews).returning();
    return newsItem;
  }

  async deleteNews(id: string): Promise<void> {
    await db.delete(news).where(eq(news.id, id));
  }

  async getChatMessages(gameId?: string, limit: number = 100): Promise<ChatMessage[]> {
    if (gameId) {
      return await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.gameId, gameId))
        .orderBy(chatMessages.createdAt)
        .limit(limit);
    }
    return await db
      .select()
      .from(chatMessages)
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(cleanObject(messageData) as InsertChatMessage).returning();
    return message;
  }

  async getAllPickems(): Promise<Pickem[]> {
    return await db.select().from(pickems).orderBy(desc(pickems.week));
  }

  async getPickemByWeek(week: number): Promise<Pickem | undefined> {
    const [pickem] = await db.select().from(pickems).where(eq(pickems.week, week));
    return pickem;
  }

  async createPickem(pickemData: InsertPickem): Promise<Pickem> {
    const [pickem] = await db.insert(pickems).values(cleanObject(pickemData) as InsertPickem).returning();
    return pickem;
  }

  async deletePickem(id: string): Promise<void> {
    await db.delete(pickems).where(eq(pickems.id, id));
  }

  async getPickemRules(): Promise<PickemRules | undefined> {
    const [rules] = await db.select().from(pickemRules).limit(1);
    return rules;
  }

  async upsertPickemRules(rulesData: InsertPickemRules): Promise<PickemRules> {
    const existing = await this.getPickemRules();
    const cleanData = cleanObject(rulesData);
    
    if (existing) {
      const [updated] = await db
        .update(pickemRules)
        .set(cleanData)
        .where(eq(pickemRules.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(pickemRules).values(cleanData as InsertPickemRules).returning();
    return created;
  }

  async getAllStandings(): Promise<Standings[]> {
    return await db.select().from(standings).orderBy(standings.division);
  }

  async upsertStandings(standingData: InsertStandings): Promise<Standings> {
    const cleanData = cleanObject(standingData);
    // Only search if we have both team and division
    if (!cleanData.team || !cleanData.division) {
      const [created] = await db.insert(standings).values(cleanData as InsertStandings).returning();
      return created;
    }
    
    const existing = await db
      .select()
      .from(standings)
      .where(and(eq(standings.team, cleanData.team as string), eq(standings.division, cleanData.division as string)));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(standings)
        .set(cleanData)
        .where(eq(standings.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(standings).values(cleanData as InsertStandings).returning();
    return created;
  }

  async deleteStandings(id: string): Promise<void> {
    await db.delete(standings).where(eq(standings.id, id));
  }

  async getAllPlayoffMatches(): Promise<PlayoffMatch[]> {
    return await db.select().from(playoffMatches).orderBy(playoffMatches.round, playoffMatches.matchNumber);
  }

  async getPlayoffMatchesByRound(round: string): Promise<PlayoffMatch[]> {
    return await db.select().from(playoffMatches).where(eq(playoffMatches.round, round)).orderBy(playoffMatches.matchNumber);
  }

  async createPlayoffMatch(matchData: InsertPlayoffMatch): Promise<PlayoffMatch> {
    const [match] = await db.insert(playoffMatches).values(cleanObject(matchData) as InsertPlayoffMatch).returning();
    return match;
  }

  async updatePlayoffMatch(id: string, matchData: Partial<PlayoffMatch>): Promise<PlayoffMatch> {
    const cleanData = cleanObject(matchData);
    const [match] = await db
      .update(playoffMatches)
      .set(cleanData)
      .where(eq(playoffMatches.id, id))
      .returning();
    return match;
  }

  async deletePlayoffMatch(id: string): Promise<void> {
    await db.delete(playoffMatches).where(eq(playoffMatches.id, id));
  }

  async getAllChangelogs(): Promise<Changelog[]> {
    return await db.select().from(changelogs).orderBy(desc(changelogs.createdAt));
  }

  async createChangelog(changelogData: InsertChangelog): Promise<Changelog> {
    const [changelog] = await db.insert(changelogs).values(cleanObject(changelogData) as InsertChangelog).returning();
    return changelog;
  }

  async deleteChangelog(id: string): Promise<void> {
    await db.delete(changelogs).where(eq(changelogs.id, id));
  }

  async getPredictionsByGameId(gameId: string): Promise<Prediction[]> {
    return await db.select().from(predictions).where(eq(predictions.gameId, gameId));
  }

  async getUserPredictionForGame(userId: string, gameId: string): Promise<Prediction | undefined> {
    const [prediction] = await db.select().from(predictions).where(and(eq(predictions.userId, userId), eq(predictions.gameId, gameId)));
    return prediction;
  }

  async createPrediction(predictionData: InsertPrediction): Promise<Prediction> {
    const [prediction] = await db.insert(predictions).values(cleanObject(predictionData) as InsertPrediction).returning();
    return prediction;
  }

  async getBracketImage(): Promise<BracketImage | undefined> {
    const [image] = await db.select().from(bracketImages).limit(1);
    return image;
  }

  async upsertBracketImage(imageData: InsertBracketImage): Promise<BracketImage> {
    const cleanData = cleanObject(imageData);
    const existing = await this.getBracketImage();
    if (existing) {
      const [updated] = await db
        .update(bracketImages)
        .set(cleanData)
        .where(eq(bracketImages.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(bracketImages).values(cleanData as InsertBracketImage).returning();
    return created;
  }

  async getAllStreamRequests(): Promise<StreamRequest[]> {
    return await db.select().from(streamRequests).orderBy(desc(streamRequests.createdAt));
  }

  async getStreamRequestsByUser(userId: string): Promise<StreamRequest[]> {
    return await db.select().from(streamRequests).where(eq(streamRequests.userId, userId)).orderBy(desc(streamRequests.createdAt));
  }

  async getStreamRequestsByGame(gameId: string): Promise<StreamRequest[]> {
    return await db.select().from(streamRequests).where(eq(streamRequests.gameId, gameId)).orderBy(desc(streamRequests.createdAt));
  }

  async createStreamRequest(requestData: InsertStreamRequest): Promise<StreamRequest> {
    const [request] = await db.insert(streamRequests).values(cleanObject(requestData) as InsertStreamRequest).returning();
    return request;
  }

  async updateStreamRequest(id: string, requestData: Partial<StreamRequest>): Promise<StreamRequest> {
    const cleanData = cleanObject(requestData);
    const [request] = await db
      .update(streamRequests)
      .set(cleanData)
      .where(eq(streamRequests.id, id))
      .returning();
    return request;
  }

  async deleteStreamRequest(id: string): Promise<void> {
    await db.delete(streamRequests).where(eq(streamRequests.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set(cleanObject({ role }) as any)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserTourStatus(id: string, completed: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ hasCompletedTour: completed })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUserWithPassword(username: string, password: string, role: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values(cleanObject({
      username,
      password: hashedPassword,
      firstName: username,
      lastName: "",
      role,
      hasCompletedTour: false,
    }) as any).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getSetting(key: string): Promise<string | null> {
    const [result] = await db.select().from(settings).where(eq(settings.key, key));
    return result?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const cleanData = cleanObject({ key, value });
    await db
      .insert(settings)
      .values(cleanData as any)
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: cleanData.value },
      });
  }

  async getAllPartners(): Promise<Partner[]> {
    return await db.select().from(partners).orderBy(partners.createdAt);
  }

  async createPartner(partnerData: InsertPartners): Promise<Partner> {
    const [partner] = await db.insert(partners).values(cleanObject(partnerData) as InsertPartners).returning();
    return partner;
  }

  async updatePartner(id: string, partnerData: Partial<Partner>): Promise<Partner> {
    const cleanData = cleanObject(partnerData);
    const [partner] = await db
      .update(partners)
      .set(cleanData)
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }

  async deletePartner(id: string): Promise<void> {
    await db.delete(partners).where(eq(partners.id, id));
  }

  async getUserPreferences(userId: string): Promise<UserPreference | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async updateUserPreferences(userId: string, prefsData: InsertUserPreferences): Promise<UserPreference> {
    const cleanData = cleanObject(prefsData);
    const existing = await this.getUserPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set(cleanData)
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(userPreferences).values({ userId, ...cleanData } as InsertUserPreferences).returning();
    return created;
  }

  async getAllUpdatePlans(): Promise<UpdatePlan[]> {
    return await db.select().from(updatePlans).orderBy(updatePlans.updateDate);
  }

  async getUpdatePlans(year: number): Promise<UpdatePlan[]> {
    return await db.select().from(updatePlans).where(sql`EXTRACT(YEAR FROM ${updatePlans.createdAt}) = ${year}`);
  }

  async upsertUpdatePlan(planData: InsertUpdatePlan): Promise<UpdatePlan> {
    const cleanData = cleanObject(planData);
    const existing = await db.select().from(updatePlans).where(eq(updatePlans.updateDate, cleanData.updateDate as string));

    if (existing.length > 0) {
      const [plan] = await db
        .update(updatePlans)
        .set({ updatedAt: new Date() })
        .where(eq(updatePlans.updateDate, cleanData.updateDate as string))
        .returning();
      return plan;
    }

    const [plan] = await db.insert(updatePlans).values(cleanData as InsertUpdatePlan).returning();
    return plan;
  }

  async deleteUpdatePlan(date: string): Promise<void> {
    await db.delete(updatePlans).where(eq(updatePlans.updateDate, date));
  }

  async getUserBets(userId: string): Promise<Bet[]> {
    return await db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
  }

  async placeBet(betData: InsertBet): Promise<Bet> {
    console.log("[STORAGE] Placing bet:", betData);
    const [bet] = await db.insert(bets).values({
      userId: betData.userId,
      gameId: betData.gameId,
      amount: betData.amount,
      pickedTeam: betData.pickedTeam,
      multiplier: betData.multiplier,
      status: betData.status || 'pending',
      parlayId: betData.parlayId
    }).returning();
    
    const user = await this.getUser(betData.userId);
    if (user) {
      console.log("[STORAGE] Updating balance for user:", betData.userId);
      await this.updateUserBalance(betData.userId, (user.coins || 1000) - betData.amount);
    }
    return bet;
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.coins || 1000;
  }

  async updateUserBalance(userId: string, amount: number): Promise<User> {
    console.log(`[STORAGE] Setting balance for user ${userId} to ${amount}`);
    const [user] = await db.update(users).set({ coins: Math.max(0, amount) }).where(eq(users.id, userId)).returning();
    return user;
  }

  async resolveBetsForGame(gameId: string): Promise<void> {
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        console.log(`[BET RESOLUTION] Game ${gameId} not found`);
        return;
      }

      if (!game.isFinal) {
        console.log(`[BET RESOLUTION] Game ${gameId} is not final yet`);
        return;
      }

      // Get all bets on this game that haven't been resolved yet
      const gameBets = await db.select().from(bets).where(eq(bets.gameId, gameId));
      const unresolvedBets = gameBets.filter(b => b.won === null);
      
      console.log(`[BET RESOLUTION] Found ${gameBets.length} total bets, ${unresolvedBets.length} unresolved`);

      // Determine winner
      const winner = game.team1Score != null && game.team2Score != null
        ? game.team1Score > game.team2Score
          ? game.team1
          : game.team2
        : null;

      if (!winner) {
        console.log(`[BET RESOLUTION] Could not determine winner (scores: ${game.team1Score} vs ${game.team2Score})`);
        return;
      }

      console.log(`[BET RESOLUTION] Winner determined: ${winner}`);

      // Resolve each unresolved bet
      for (const bet of unresolvedBets) {
        const isWinningBet = bet.pickedTeam === winner;
        
        if (isWinningBet) {
          // Use the multiplier stored on the bet if available
          const multiplier = bet.multiplier ? (bet.multiplier / 100) : 
                             (winner === game.team1 ? (game.team1Odds || 150) : (game.team2Odds || 150)) / 100;
          
          const totalPayout = Math.floor(bet.amount * multiplier);
          
          console.log(`[BET RESOLUTION] Bet ${bet.id}: WIN - ${bet.pickedTeam} at ${multiplier}x odds. Payout: ${totalPayout}`);
          
          // Mark bet as won
          await db
            .update(bets)
            .set({ won: true })
            .where(eq(bets.id, bet.id));
            
          // Add payout to user's balance
          const user = await this.getUser(bet.userId);
          if (user) {
            const newBalance = (user.coins || 0) + totalPayout;
            await this.updateUserBalance(bet.userId, newBalance);
            console.log(`[BET RESOLUTION] User ${bet.userId} balance updated: ${user.coins} -> ${newBalance}`);
          }
        } else {
          console.log(`[BET RESOLUTION] Bet ${bet.id}: LOSS - ${bet.pickedTeam}`);
          // Mark bet as lost
          await db
            .update(bets)
            .set({ won: false })
            .where(eq(bets.id, bet.id));
        }
      }
    } catch (error) {
      console.error("[BET RESOLUTION] Error resolving bets:", error);
    }
  }

  async unresolveBeetsForGame(gameId: string): Promise<void> {
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        console.log(`[BET UNRESOLVE] Game ${gameId} not found`);
        return;
      }

      // Get all resolved bets on this game
      const gameBets = await db.select().from(bets).where(eq(bets.gameId, gameId));
      const resolvedBets = gameBets.filter(b => b.won !== null);
      
      console.log(`[BET UNRESOLVE] Found ${gameBets.length} total bets, ${resolvedBets.length} resolved`);

      // Unresolve each resolved bet
      for (const bet of resolvedBets) {
        if (bet.won === true) {
          // This was a winning bet - we need to refund the payout
          const multiplier = bet.multiplier ? (bet.multiplier / 100) : 1.5;
          const totalPayout = Math.floor(bet.amount * multiplier);
          
          console.log(`[BET UNRESOLVE] Bet ${bet.id}: Was winning - refunding ${totalPayout}`);
          
          // Subtract payout from user's balance
          const user = await this.getUser(bet.userId);
          if (user) {
            const newBalance = (user.coins || 0) - totalPayout;
            await this.updateUserBalance(bet.userId, Math.max(0, newBalance));
            console.log(`[BET UNRESOLVE] User ${bet.userId} balance updated: ${user.coins} -> ${newBalance}`);
          }
        } else {
          console.log(`[BET UNRESOLVE] Bet ${bet.id}: Was losing - no refund needed`);
        }
        
        // Mark bet as unresolved
        await db
          .update(bets)
          .set({ won: null })
          .where(eq(bets.id, bet.id));
      }
    } catch (error) {
      console.error("[BET UNRESOLVE] Error unresolvling bets:", error);
    }
  }
}

export const storage = new DatabaseStorage();
