import { 
  users, 
  type User, 
  type InsertUser, 
  type Mention, 
  type InsertMention, 
  type Stats, 
  type ResponseMode, 
  type ResponseStatus 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdminUser(): Promise<User | undefined>;
  updateTwitterCredentials(accessToken: string, accessSecret: string, username: string): Promise<User>;
  updateOpenAIKey(apiKey: string): Promise<User>;
  toggleBotActive(): Promise<boolean>;
  
  // Mention operations
  getRecentMentions(count: number): Promise<Mention[]>;
  getMentionByTweetId(tweetId: string): Promise<Mention | undefined>;
  createMention(mention: InsertMention): Promise<Mention>;
  updateMentionResponse(
    tweetId: string, 
    responseId: string | null, 
    responseContent: string, 
    responseMode: ResponseMode, 
    status: ResponseStatus
  ): Promise<Mention>;
  
  // Stats operations
  getStats(): Promise<Stats>;
  incrementStats(responseMode: ResponseMode): Promise<Stats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mentions: Map<number, Mention>;
  private stats: Stats;
  private userCurrentId: number;
  private mentionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.mentions = new Map();
    this.userCurrentId = 1;
    this.mentionCurrentId = 1;
    
    // Initialize with default stats
    this.stats = {
      id: 1,
      totalResponses: 0,
      todayResponses: 0,
      positiveRating: 0,
      negativeRating: 0,
      avgResponseTime: 0,
      wittyCount: 0,
      roastCount: 0,
      debateCount: 0,
      peaceCount: 0,
      date: new Date()
    };
    
    // Create default admin user if none exists
    this.createDefaultAdmin();
  }
  
  private async createDefaultAdmin() {
    // Create a default admin user if none exists
    const adminUser = await this.getAdminUser();
    if (!adminUser) {
      await this.createUser({
        username: "admin",
        password: "admin", // This is insecure and should be changed in production
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      twitterAccessToken: null,
      twitterAccessSecret: null,
      twitterUsername: null,
      openaiApiKey: null,
      botActive: false as boolean
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAdminUser(): Promise<User | undefined> {
    // For simplicity, we'll consider the first user as admin
    // In a real app, you'd have a role system
    if (this.users.size === 0) {
      return undefined;
    }
    
    // Get the user with the smallest ID (first created)
    const allUsers = Array.from(this.users.values());
    return allUsers.sort((a, b) => a.id - b.id)[0];
  }
  
  async updateTwitterCredentials(accessToken: string, accessSecret: string, username: string): Promise<User> {
    const adminUser = await this.getAdminUser();
    if (!adminUser) {
      throw new Error("Admin user not found");
    }
    
    const updatedUser: User = {
      ...adminUser,
      twitterAccessToken: accessToken,
      twitterAccessSecret: accessSecret,
      twitterUsername: username
    };
    
    this.users.set(adminUser.id, updatedUser);
    return updatedUser;
  }
  
  async updateOpenAIKey(apiKey: string): Promise<User> {
    const adminUser = await this.getAdminUser();
    if (!adminUser) {
      throw new Error("Admin user not found");
    }
    
    const updatedUser: User = {
      ...adminUser,
      openaiApiKey: apiKey
    };
    
    this.users.set(adminUser.id, updatedUser);
    return updatedUser;
  }
  
  async toggleBotActive(): Promise<boolean> {
    const adminUser = await this.getAdminUser();
    if (!adminUser) {
      throw new Error("Admin user not found");
    }
    
    const newBotActiveState = adminUser.botActive ? false : true;
    
    const updatedUser: User = {
      ...adminUser,
      botActive: newBotActiveState
    };
    
    this.users.set(adminUser.id, updatedUser);
    return newBotActiveState;
  }
  
  async getRecentMentions(count: number = 20): Promise<Mention[]> {
    const allMentions = Array.from(this.mentions.values());
    // Sort by created date, newest first
    return allMentions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count);
  }
  
  async getMentionByTweetId(tweetId: string): Promise<Mention | undefined> {
    return Array.from(this.mentions.values()).find(
      (mention) => mention.tweetId === tweetId
    );
  }
  
  async createMention(insertMention: InsertMention): Promise<Mention> {
    const id = this.mentionCurrentId++;
    const mention: Mention = {
      id,
      tweetId: insertMention.tweetId,
      authorUsername: insertMention.authorUsername,
      authorName: insertMention.authorName || null,
      authorProfileImage: insertMention.authorProfileImage || null,
      content: insertMention.content,
      command: insertMention.command || null,
      createdAt: insertMention.createdAt,
      responseId: insertMention.responseId || null,
      responseContent: insertMention.responseContent || null,
      responseMode: insertMention.responseMode || null,
      responseStatus: insertMention.responseStatus || "pending",
      responseSentAt: insertMention.responseSentAt || null
    };
    
    this.mentions.set(id, mention);
    return mention;
  }
  
  async updateMentionResponse(
    tweetId: string, 
    responseId: string | null, 
    responseContent: string, 
    responseMode: ResponseMode, 
    status: ResponseStatus
  ): Promise<Mention> {
    const mention = await this.getMentionByTweetId(tweetId);
    if (!mention) {
      throw new Error(`Mention with tweet ID ${tweetId} not found`);
    }
    
    const updatedMention: Mention = {
      ...mention,
      responseId: responseId || mention.responseId,
      responseContent,
      responseMode,
      responseStatus: status,
      responseSentAt: status === "sent" ? new Date() : mention.responseSentAt
    };
    
    this.mentions.set(mention.id, updatedMention);
    return updatedMention;
  }
  
  async getStats(): Promise<Stats> {
    return this.stats;
  }
  
  async incrementStats(responseMode: ResponseMode): Promise<Stats> {
    // Create a safe clone of stats to avoid null reference issues
    const stats = { ...this.stats };
    
    // Update the total and by-mode counts
    stats.totalResponses = (stats.totalResponses || 0) + 1;
    stats.todayResponses = (stats.todayResponses || 0) + 1;
    
    // Update specific response type count
    switch (responseMode) {
      case "witty":
        stats.wittyCount = (stats.wittyCount || 0) + 1;
        break;
      case "roast":
        stats.roastCount = (stats.roastCount || 0) + 1;
        break;
      case "debate":
        stats.debateCount = (stats.debateCount || 0) + 1;
        break;
      case "peace":
        stats.peaceCount = (stats.peaceCount || 0) + 1;
        break;
    }
    
    // Update the main stats object
    this.stats = stats;
    
    return stats;
  }
}

export const storage = new MemStorage();
