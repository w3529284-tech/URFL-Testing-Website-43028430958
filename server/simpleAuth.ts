import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

interface AdminCredentials {
  username: string;
  password: string;
  role: "admin" | "streamer";
}

function getAdminCredentials(): AdminCredentials[] {
  const credentials: AdminCredentials[] = [];
  
  // Default credentials for development
  credentials.push({
    username: process.env.ADMIN_USERNAME || "popfork1",
    password: process.env.ADMIN_PASSWORD || "dairyqueen12",
    role: "admin"
  });
  
  if (process.env.STREAMER1_USERNAME && process.env.STREAMER1_PASSWORD) {
    credentials.push({
      username: process.env.STREAMER1_USERNAME,
      password: process.env.STREAMER1_PASSWORD,
      role: "streamer"
    });
  }
  
  if (process.env.STREAMER2_USERNAME && process.env.STREAMER2_PASSWORD) {
    credentials.push({
      username: process.env.STREAMER2_USERNAME,
      password: process.env.STREAMER2_PASSWORD,
      role: "streamer"
    });
  }
  
  return credentials;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const credentials = getAdminCredentials();
    
    const matchedEnvUser = credentials.find(
      c => c.username === username && c.password === password
    );

    if (matchedEnvUser) {
      const userId = `user_${matchedEnvUser.username}`;
      
      await storage.upsertUser({
        id: userId,
        username: matchedEnvUser.username,
        password: matchedEnvUser.password,
        email: `${matchedEnvUser.username}@urfl.com`,
        firstName: matchedEnvUser.username,
        lastName: "",
        role: matchedEnvUser.role,
      });
      
      (req.session as any).authenticated = true;
      (req.session as any).userId = userId;
      (req.session as any).username = matchedEnvUser.username;
      (req.session as any).role = matchedEnvUser.role;
      
      res.json({ success: true });
      return;
    }
    
    const dbUser = await storage.getUserByUsername(username);
    if (dbUser && dbUser.password === password) {
      (req.session as any).authenticated = true;
      (req.session as any).userId = dbUser.id;
      (req.session as any).username = dbUser.username;
      (req.session as any).role = dbUser.role || "streamer";
      
      res.json({ success: true });
      return;
    }
    
    res.status(401).json({ message: "Invalid credentials" });
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if ((req.session as any).authenticated) {
      const userId = (req.session as any).userId;
      const username = (req.session as any).username;
      const role = (req.session as any).role;
      
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: `${username}@urfl.com`,
          firstName: username,
          lastName: "",
          role: role,
        });
      }
      
      res.json({ 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || role,
        authenticated: true 
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if ((req.session as any).authenticated) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
