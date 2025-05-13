import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  twitterAccessToken: text("twitter_access_token"),
  twitterAccessSecret: text("twitter_access_secret"),
  twitterUsername: text("twitter_username"),
  openaiApiKey: text("openai_api_key"),
  botActive: boolean("bot_active").default(false),
});

export const mentions = pgTable("mentions", {
  id: serial("id").primaryKey(),
  tweetId: text("tweet_id").notNull().unique(),
  authorUsername: text("author_username").notNull(),
  authorName: text("author_name"),
  authorProfileImage: text("author_profile_image"),
  content: text("content").notNull(),
  command: text("command"),
  createdAt: timestamp("created_at").notNull(),
  responseId: text("response_id"),
  responseContent: text("response_content"),
  responseMode: text("response_mode"),
  responseStatus: text("response_status").default("pending"),
  responseSentAt: timestamp("response_sent_at"),
});

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  totalResponses: integer("total_responses").default(0),
  todayResponses: integer("today_responses").default(0),
  positiveRating: integer("positive_rating").default(0),
  negativeRating: integer("negative_rating").default(0),
  avgResponseTime: integer("avg_response_time").default(0),
  wittyCount: integer("witty_count").default(0),
  roastCount: integer("roast_count").default(0),
  debateCount: integer("debate_count").default(0),
  peaceCount: integer("peace_count").default(0),
  date: timestamp("date").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMentionSchema = createInsertSchema(mentions).omit({
  id: true,
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMention = z.infer<typeof insertMentionSchema>;
export type Mention = typeof mentions.$inferSelect;

export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof stats.$inferSelect;

export type ResponseMode = "witty" | "roast" | "debate" | "peace";
export type ResponseStatus = "pending" | "sent" | "failed";

export interface MentionWithResponse extends Mention {
  isLoading?: boolean;
}

export interface BotStatus {
  active: boolean;
  connected: boolean;
  username: string;
  description: string;
}

export interface BotStats {
  totalResponses: number;
  todayResponses: number;
  positiveRating: number;
  avgResponseTime: number;
  responseTypes: {
    witty: number;
    roast: number;
    debate: number;
    peace: number;
  };
}

export interface Command {
  name: string;
  icon: string;
  description: string;
  example: string;
}
