import { users, type User, type UpsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";
import { chatStorage } from "./replit_integrations/chat/storage";

// Re-export integration storages
export { authStorage, chatStorage };

export interface IStorage {
  // Add custom storage methods here if needed
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // We can delegate to authStorage for user related things or implement our own
  // Since we are using Replit Auth, we mainly rely on authStorage.upsertUser

  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username)); // Approximate username as email for now
    return user;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    // This is mostly for compatibility if we were using local auth
    // With Replit Auth, users are created via upsertUser in auth/storage.ts
    // We'll just throw or call upsertUser
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
