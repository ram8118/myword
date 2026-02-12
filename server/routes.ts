import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function normalizeWord(input: string) {
  return input.trim().toLowerCase();
}

function listToCsv(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return items
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(", ");
}

async function aiLookup(word: string) {
  const prompt =
    `Return JSON only in this exact format:\n` +
    `{
  "word": "",
  "ipa": "",
  "partOfSpeech": "",
  "definition": "",
  "example": "",
  "synonyms": [],
  "antonyms": [],
  "usageTips": ""
}\n\n` +
    `Give meaning for the word: ${word}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content:
          "You are a dictionary. Return strict JSON only. If the word is not a valid English word, return an empty definition string.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 800,
  } as any);

  const content = response.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

const aiWordSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().optional().default(""),
  partOfSpeech: z.string().optional().default(""),
  definition: z.string().optional().default(""),
  example: z.string().optional().default(""),
  synonyms: z.array(z.string()).optional().default([]),
  antonyms: z.array(z.string()).optional().default([]),
  usageTips: z.string().optional().default(""),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Lookup using AI and always write to search history
  app.post(api.dictionary.lookup.path, async (req, res) => {
    try {
      const input = api.dictionary.lookup.input.parse(req.body);
      const word = normalizeWord(input.word);

      if (!word) {
        return res.status(400).json({ message: "Word is required", field: "word" });
      }

      const cached = await storage.getSavedWord(word);
      await storage.addSearchHistory(word);

      if (cached) {
        return res.json({ result: cached, fromCache: true });
      }

      const aiJson = await aiLookup(word);
      const parsed = aiWordSchema.parse(aiJson);

      if (!parsed.definition || parsed.definition.trim().length === 0) {
        return res.status(404).json({ message: "Word not found" });
      }

      const result = {
        word,
        ipa: parsed.ipa ?? "",
        partOfSpeech: parsed.partOfSpeech ?? "",
        definition: parsed.definition ?? "",
        example: parsed.example ?? "",
        synonyms: listToCsv(parsed.synonyms),
        antonyms: listToCsv(parsed.antonyms),
        usageTips: parsed.usageTips ?? "",
        timestamp: new Date(),
      };

      // Note: Not auto-saving to DB here; only returned.
      return res.json({ result, fromCache: false });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid request",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  // Saved words
  app.get(api.dictionary.saved.list.path, async (_req, res) => {
    const items = await storage.getSavedWords();
    res.json(items);
  });

  app.get(api.dictionary.saved.get.path, async (req, res) => {
    const word = normalizeWord(String(req.params.word || ""));
    const item = await storage.getSavedWord(word);
    if (!item) return res.status(404).json({ message: "Word not found" });
    res.json(item);
  });

  app.post(api.dictionary.saved.create.path, async (req, res) => {
    try {
      const input = api.dictionary.saved.create.input.parse(req.body);
      const word = normalizeWord(input.word);
      const saved = await storage.saveWord({ ...input, word });
      res.status(201).json(saved);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid request",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.dictionary.saved.delete.path, async (req, res) => {
    const word = normalizeWord(String(req.params.word || ""));
    const existing = await storage.getSavedWord(word);
    if (!existing) return res.status(404).json({ message: "Word not found" });
    await storage.deleteSavedWord(word);
    res.status(204).send();
  });

  // Search history
  app.get(api.dictionary.history.list.path, async (req, res) => {
    const input = api.dictionary.history.list.input?.parse(req.query);
    const limit = input?.limit ?? 5;
    const items = await storage.getSearchHistory(limit);
    // Convert dates to strings for predictable JSON
    res.json(
      items.map((x) => ({
        id: x.id,
        word: x.word,
        searchedAt: x.searchedAt.toISOString(),
      }))
    );
  });

  // Pronunciation (TTS) - returns base64 audio
  app.post(api.dictionary.tts.speak.path, async (req, res) => {
    try {
      const input = api.dictionary.tts.speak.input.parse(req.body);
      const text = input.text.trim();

      const resp = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice: "alloy", format: "mp3" },
        messages: [
          {
            role: "system",
            content:
              "You perform text-to-speech. Repeat the provided text verbatim.",
          },
          { role: "user", content: `Repeat the following text verbatim: ${text}` },
        ],
      } as any);

      const msg: any = resp.choices?.[0]?.message;
      const audioBase64 = msg?.audio?.data ?? "";
      if (!audioBase64) {
        return res.status(500).json({ message: "Failed to synthesize audio" });
      }

      res.json({ audioBase64, contentType: "audio/mpeg" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid request",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  // Seed minimal data once
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getSavedWords();
  if (existing.length > 0) return;

  await storage.saveWord({
    word: "serendipity",
    ipa: "/ˌsɛr.ənˈdɪp.ɪ.ti/",
    partOfSpeech: "noun",
    definition:
      "The occurrence of events by chance in a happy or beneficial way.",
    example: "Finding that quiet cafe was pure serendipity.",
    synonyms: "fluke, chance, fortuity",
    antonyms: "misfortune",
    usageTips:
      "Use it to describe unexpectedly good luck, especially discoveries.",
  });

  await storage.saveWord({
    word: "meticulous",
    ipa: "/məˈtɪk.jə.ləs/",
    partOfSpeech: "adjective",
    definition: "Showing great attention to detail; very careful and precise.",
    example: "She kept meticulous notes during the lecture.",
    synonyms: "careful, thorough, exact",
    antonyms: "careless, sloppy",
    usageTips:
      "Commonly used to praise careful work: meticulous planning, meticulous research.",
  });

  await storage.addSearchHistory("serendipity");
  await storage.addSearchHistory("meticulous");
  await storage.addSearchHistory("ubiquitous");
}
