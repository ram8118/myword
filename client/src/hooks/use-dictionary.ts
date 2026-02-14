import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";
import { puterAiLookup, puterTtsSpeak } from "@/lib/puter";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useLookupWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["puter-lookup"],
    mutationFn: async (input: { word: string }) => {
      const word = input.word.trim().toLowerCase();
      if (!word) throw new Error("Word is required");

      const res = await fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
        credentials: "include",
      });

      const cachedRes = await fetch(`/api/words/${encodeURIComponent(word)}`, {
        credentials: "include",
      });

      if (cachedRes.ok) {
        const cached = await cachedRes.json();
        return { result: cached, fromCache: true };
      }

      const aiJson = await puterAiLookup(word);

      const wordData = {
        word: aiJson.word || word,
        ipa: aiJson.ipa || "",
        meanings: aiJson.meanings || [],
        phrases: aiJson.phrases || [],
        originDetails: aiJson.originDetails || {},
        translation: aiJson.translation || {},
      };

      const saveRes = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wordData),
        credentials: "include",
      });

      if (!saveRes.ok) {
        return { result: wordData, fromCache: false };
      }

      const saved = await saveRes.json();
      return { result: saved, fromCache: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.dictionary.history.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dictionary.saved.list.path] });
    },
  });
}

export function useSavedWords() {
  return useQuery({
    queryKey: [api.dictionary.saved.list.path],
    queryFn: async () => {
      const res = await fetch(api.dictionary.saved.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch saved words");
      return parseWithLogging(
        api.dictionary.saved.list.responses[200],
        await res.json(),
        "words.list 200",
      );
    },
  });
}

export function useSavedWord(word: string) {
  return useQuery({
    queryKey: [api.dictionary.saved.get.path, word],
    queryFn: async () => {
      const url = api.dictionary.saved.get.path.replace(":word", encodeURIComponent(word));
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch word");

      return parseWithLogging(api.dictionary.saved.get.responses[200], await res.json(), "words.get 200");
    },
    enabled: !!word,
  });
}

export function useCreateSavedWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [api.dictionary.saved.create.path],
    mutationFn: async (input: any) => {
      const res = await fetch(api.dictionary.saved.create.path, {
        method: api.dictionary.saved.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message);
        }
        throw new Error("Failed to save word");
      }

      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.dictionary.saved.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dictionary.history.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dictionary.saved.get.path, variables.word] });
    },
  });
}

export function useDeleteSavedWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [api.dictionary.saved.delete.path],
    mutationFn: async (word: string) => {
      const url = api.dictionary.saved.delete.path.replace(":word", encodeURIComponent(word));
      const res = await fetch(url, { method: api.dictionary.saved.delete.method, credentials: "include" });

      if (!res.ok) {
        if (res.status === 404) {
          const err = await res.json();
          throw new Error(err.message);
        }
        throw new Error("Failed to delete word");
      }

      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.dictionary.saved.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dictionary.history.list.path] });
    },
  });
}

export function useSearchHistory(limit = 5) {
  return useQuery({
    queryKey: [api.dictionary.history.list.path, `limit=${limit}`],
    queryFn: async () => {
      const qs = new URLSearchParams({ limit: String(limit) }).toString();
      const url = `${api.dictionary.history.list.path}?${qs}`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch search history");
      return parseWithLogging(api.dictionary.history.list.responses[200], await res.json(), "history.list 200");
    },
  });
}

export function useSpeakTts() {
  return useMutation({
    mutationKey: ["puter-tts"],
    mutationFn: async (input: { text: string }) => {
      const audio = await puterTtsSpeak(input.text);
      audio.play();
      return { audio };
    },
  });
}
