import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

function normalizeWord(input: string) {
  return input.trim().toLowerCase();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  app.post("/api/search-history", async (req, res) => {
    try {
      const word = normalizeWord(req.body?.word || "");
      if (!word) return res.status(400).json({ message: "Word is required" });
      const item = await storage.addSearchHistory(word);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ message: "Failed to add search history" });
    }
  });

  return httpServer;
}
