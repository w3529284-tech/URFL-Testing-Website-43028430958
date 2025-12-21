import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
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
    if (dbUser && dbUser.password) {
      console.log(`Attempting DB login for: ${username}`);
      const passwordMatch = await bcrypt.compare(password, dbUser.password);
      if (passwordMatch) {
        console.log(`Login successful for: ${username}`);
        (req.session as any).authenticated = true;
        (req.session as any).userId = dbUser.id;
        (req.session as any).username = dbUser.username;
        (req.session as any).role = dbUser.role || "guest";
        
        res.json({ success: true });
        return;
      } else {
        console.log(`Password mismatch for: ${username}`);
      }
    } else {
      console.log(`No DB user found for: ${username}`);
    }
    
    res.status(401).json({ message: "Invalid credentials" });
  });

  app.post("/api/signup", async (req, res) => {
    const rawUsername = req.body.username;
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    if (!rawUsername || !rawEmail || !rawPassword) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    const username = String(rawUsername).trim().toLowerCase();
    const email = String(rawEmail).trim().toLowerCase();
    const password = String(rawPassword);

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (username.length > 30) {
      return res.status(400).json({ message: "Username must be 30 characters or less" });
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await storage.createUserWithPassword(username, email, password, "guest");
      
      (req.session as any).authenticated = true;
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;
      (req.session as any).role = "guest";

      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
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
