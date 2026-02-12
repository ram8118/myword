import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ======================================================
// USERS
// ======================================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ======================================================
// CHAT TABLES
// ======================================================
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// ======================================================
// AI ENGLISH DICTIONARY
// ======================================================

export const words = pgTable("words", {
  word: text("word").primaryKey(),
  ipa: text("ipa").notNull().default(""),
  // New deep structure for meanings
  meanings: jsonb("meanings").notNull().default([]),
  phrases: jsonb("phrases").notNull().default([]),
  originDetails: jsonb("origin_details").notNull().default({}),
  translation: jsonb("translation").notNull().default({}),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  searchedAt: timestamp("searched_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertWordSchema = createInsertSchema(words).omit({
  timestamp: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  searchedAt: true,
});

// Explicit API contract types
export type Word = typeof words.$inferSelect;
export type InsertWord = z.infer<typeof insertWordSchema>;
export type SearchHistoryItem = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

export type CreateWordRequest = InsertWord;
export type WordResponse = Word;
export type SavedWordsResponse = Word[];
export type CreateSearchHistoryRequest = InsertSearchHistory;
export type SearchHistoryResponse = SearchHistoryItem[];

export type LookupWordRequest = {
  word: string;
};

export type LookupWordResponse = {
  result: WordResponse;
  fromCache: boolean;
};
