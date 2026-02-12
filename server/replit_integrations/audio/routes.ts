import express, { type Express, type Request, type Response } from "express";
import { chatStorage } from "../chat/storage";
import { speechToText, ensureCompatibleFormat } from "./client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const audioBodyParser = express.json({ limit: "50mb" });

export function registerAudioRoutes(app: Express): void {
  app.get("/api/conversations", async (_req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch {
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post(
    "/api/conversations/:id/messages",
    audioBodyParser,
    async (req: Request, res: Response) => {
      try {
        const conversationId = parseInt(req.params.id);
        const { audio, voice = "alloy" } = req.body;

        if (!audio) {
          return res.status(400).json({ error: "Audio data (base64) is required" });
        }

        const rawBuffer = Buffer.from(audio, "base64");
        const { buffer: audioBuffer, format: inputFormat } =
          await ensureCompatibleFormat(rawBuffer);

        const userTranscript = await speechToText(audioBuffer, inputFormat);
        await chatStorage.createMessage(conversationId, "user", userTranscript);

        const existingMessages = await chatStorage.getMessagesByConversation(conversationId);
        const chatHistory = existingMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        res.write(
          `data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`
        );

        const stream = await openai.chat.completions.create({
          model: "gpt-audio",
          modalities: ["text", "audio"],
          audio: { voice, format: "pcm16" },
          messages: chatHistory,
          stream: true,
        } as any);

        let assistantTranscript = "";

        for await (const chunk of stream) {
          const delta = (chunk.choices?.[0]?.delta as any) ?? null;
          if (!delta) continue;

          if (delta?.audio?.transcript) {
            assistantTranscript += delta.audio.transcript;
            res.write(
              `data: ${JSON.stringify({ type: "transcript", data: delta.audio.transcript })}\n\n`
            );
          }

          if (delta?.audio?.data) {
            res.write(
              `data: ${JSON.stringify({ type: "audio", data: delta.audio.data })}\n\n`
            );
          }
        }

        await chatStorage.createMessage(conversationId, "assistant", assistantTranscript);

        res.write(
          `data: ${JSON.stringify({ type: "done", transcript: assistantTranscript })}\n\n`
        );
        res.end();
      } catch {
        if (res.headersSent) {
          res.write(
            `data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`
          );
          res.end();
        } else {
          res.status(500).json({ error: "Failed to process voice message" });
        }
      }
    }
  );
}
