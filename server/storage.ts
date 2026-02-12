import { db } from "./db";
import {
  words,
  searchHistory,
  type InsertWord,
  type Word,
  type SearchHistoryItem,
} from "@shared/schema";
import { desc, eq, sql } from "drizzle-orm";

export interface IStorage {
  getSavedWords(): Promise<Word[]>;
  getSavedWord(word: string): Promise<Word | undefined>;
  saveWord(word: InsertWord): Promise<Word>;
  deleteSavedWord(word: string): Promise<void>;

  addSearchHistory(word: string): Promise<SearchHistoryItem>;
  getSearchHistory(limit: number): Promise<SearchHistoryItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getSavedWords(): Promise<Word[]> {
    return db.select().from(words).orderBy(desc(words.timestamp));
  }

  async getSavedWord(word: string): Promise<Word | undefined> {
    const [row] = await db.select().from(words).where(eq(words.word, word));
    return row;
  }

  async saveWord(wordToSave: InsertWord): Promise<Word> {
    const [row] = await db
      .insert(words)
      .values(wordToSave)
      .onConflictDoUpdate({
        target: words.word,
        set: {
          ipa: wordToSave.ipa,
          partOfSpeech: wordToSave.partOfSpeech,
          definition: wordToSave.definition,
          example: wordToSave.example,
          synonyms: wordToSave.synonyms,
          antonyms: wordToSave.antonyms,
          usageTips: wordToSave.usageTips,
          timestamp: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();

    return row;
  }

  async deleteSavedWord(word: string): Promise<void> {
    await db.delete(words).where(eq(words.word, word));
  }

  async addSearchHistory(word: string): Promise<SearchHistoryItem> {
    const [row] = await db.insert(searchHistory).values({ word }).returning();
    return row;
  }

  async getSearchHistory(limit: number): Promise<SearchHistoryItem[]> {
    return db
      .select()
      .from(searchHistory)
      .orderBy(desc(searchHistory.searchedAt), desc(searchHistory.id))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
