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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
  getUserByUsername(username: string): Promise<User | undefined>;
  createUserWithPassword(username: string, password: string, role: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

// Helper function to clean undefined values from objects
function cleanObject(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const cleanData = cleanObject(userData);
    const [user] = await db
      .insert(users)
      .values(cleanData as UpsertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...cleanData,
          updatedAt: new Date(),
        },
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
    const [game] = await db
      .update(games)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
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
        .set({ ...cleanData, updatedAt: new Date() })
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
        .set({ ...cleanData, updatedAt: new Date() })
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
      .set({ ...cleanData, updatedAt: new Date() })
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
        .set({ ...cleanData, updatedAt: new Date() })
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
      .set({ ...cleanData, updatedAt: new Date() })
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
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUserWithPassword(username: string, password: string, role: string): Promise<User> {
    const [user] = await db.insert(users).values({
      username,
      password,
      email: `${username}@urfl.com`,
      firstName: username,
      lastName: "",
      role,
    }).returning();
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
    const existing = await this.getSetting(key);
    if (existing) {
      await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value });
    }
  }
}

export const storage = new DatabaseStorage();
