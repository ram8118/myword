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

async function aiLookup(word: string) {
  const prompt =
    `Return JSON only. Format strictly like Google Search dictionary for "${word}".\n` +
    `Ensure every part of speech is listed. Use specific numbering (1., 2., 3.) for main definitions.\n` +
    `Use sub-points (dot points) for related definitions under a main number.\n` +
    `Include plurality for nouns (e.g., "noun: scoop; plural noun: scoops").\n` +
    `Include verb forms (e.g., "verb: scoop; 3rd person present: scoops...").\n` +
    `Include "Similar" chips for BOTH main definitions AND sub-definitions where applicable.\n` +
    `Include "Origin" with text and a flow array (e.g., ["MIDDLE DUTCH", "MIDDLE LOW GERMAN", "ENGLISH"]).\n` +
    `Include "Phrases" section if common.\n` +
    `Example Structure:\n` +
    `{
  "word": "scoop",
  "ipa": "/skuːp/",
  "meanings": [
    {
      "partOfSpeech": "noun",
      "forms": "noun: scoop; plural noun: scoops",
      "definitions": [
        {
          "definition": "a utensil resembling a spoon...",
          "example": "the powder is packed in tubs...",
          "synonyms": ["spoon", "ladle"],
          "subs": [
            { "definition": "a short-handled deep shovel...", "example": "..." },
            { "definition": "a moving bowl-shaped part...", "example": "..." }
          ]
        }
      ]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a professional lexicographer. Return exhaustive, deeply structured JSON mirroring Google's Search Dictionary exactly. Do not skip any meanings. Use nested sub-definitions and specific part-of-speech forms. Include origin flow and common phrases.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2500,
  } as any);

  return JSON.parse(response.choices?.[0]?.message?.content ?? "{}");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      
      // Save to storage
      const result = await storage.saveWord({
        word: aiJson.word || word,
        ipa: aiJson.ipa || "",
        meanings: aiJson.meanings || [],
        phrases: aiJson.phrases || [],
        originDetails: aiJson.originDetails || {},
        translation: aiJson.translation || {},
      });

      return res.json({ result, fromCache: false });
    } catch (err) {
      console.error("Lookup error:", err);
      res.status(500).json({ message: "Lookup failed" });
    }
  });

  app.get(api.dictionary.saved.list.path, async (_req, res) => {
    res.json(await storage.getSavedWords());
  });

  app.get(api.dictionary.saved.get.path, async (req, res) => {
    const word = normalizeWord(String(req.params.word || ""));
    const item = await storage.getSavedWord(word);
    if (!item) return res.status(404).json({ message: "Word not found" });
    res.json(item);
  });

  app.post(api.dictionary.saved.create.path, async (req, res) => {
    const input = api.dictionary.saved.create.input.parse(req.body);
    res.status(201).json(await storage.saveWord(input));
  });

  app.delete(api.dictionary.saved.delete.path, async (req, res) => {
    await storage.deleteSavedWord(normalizeWord(req.params.word));
    res.status(204).send();
  });

  app.get(api.dictionary.history.list.path, async (req, res) => {
    const limit = Number(req.query.limit) || 5;
    res.json(await storage.getSearchHistory(limit));
  });

  app.post(api.dictionary.tts.speak.path, async (req, res) => {
    const input = api.dictionary.tts.speak.input.parse(req.body);
    const resp = await openai.chat.completions.create({
      model: "gpt-audio",
      modalities: ["text", "audio"],
      audio: { voice: "alloy", format: "mp3" },
      messages: [{ role: "user", content: input.text }],
    } as any);
    const audioBase64 = (resp.choices?.[0]?.message as any)?.audio?.data || "";
    res.json({ audioBase64, contentType: "audio/mpeg" });
  });

  return httpServer;
}
