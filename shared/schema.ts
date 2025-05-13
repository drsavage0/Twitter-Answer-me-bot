import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  profileInfo: jsonb("profile_info"),
  openaiApiKey: text("openai_api_key"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  code: text("code").notNull().unique(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").default(0),
  hasJoined: boolean("has_joined").default(false),
  joinedAt: timestamp("joined_at"),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  content: text("content").notNull(),
  about: integer("about"), // user ID this question is about
  options: jsonb("options").notNull(), // array of possible answers
  correctOption: integer("correct_option").notNull(),
  explanation: text("explanation"),
  type: text("question_type").default("multiple_choice"),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  participantId: integer("participant_id").notNull(),
  selectedOption: integer("selected_option").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalGames: integer("total_games").default(0),
  totalWins: integer("total_wins").default(0),
  averageScore: integer("average_score").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  profileInfo: true,
}).extend({
  confirmPassword: z.string().min(6),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  code: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  score: true,
  joinedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  answeredAt: true,
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof stats.$inferSelect;

// Additional Types for the App
export type QuestionType = "multiple_choice" | "true_false" | "open_ended";

export interface QuestionOption {
  id: number;
  text: string;
}

export interface QuizWithQuestions extends Quiz {
  questions: Question[];
  participants: number;
}

export interface UserProfile {
  preferences: string[];
  interests: string[];
  traits: string[];
  facts: Record<string, string>;
}

export interface GameState {
  quizId: number;
  participants: Participant[];
  currentQuestionIndex: number;
  status: "waiting" | "playing" | "finished";
}

export interface LeaderboardEntry {
  username: string;
  displayName: string;
  score: number;
  rank: number;
}

export interface QuizSummary {
  id: number;
  title: string;
  description: string;
  creatorName: string;
  participants: number;
  questions: number;
}
