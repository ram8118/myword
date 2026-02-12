import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

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
    mutationKey: [api.dictionary.lookup.path],
    mutationFn: async (input: z.infer<typeof api.dictionary.lookup.input>) => {
      const validated = api.dictionary.lookup.input.parse(input);

      const res = await fetch(api.dictionary.lookup.path, {
        method: api.dictionary.lookup.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.dictionary.lookup.responses[400], await res.json(), "dictionary.lookup 400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.dictionary.lookup.responses[404], await res.json(), "dictionary.lookup 404");
          throw new Error(err.message);
        }
        throw new Error("Failed to look up word");
      }

      const json = await res.json();
      return parseWithLogging(api.dictionary.lookup.responses[200], json, "dictionary.lookup 200");
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
    mutationFn: async (input: z.infer<typeof api.dictionary.saved.create.input>) => {
      const validated = api.dictionary.saved.create.input.parse(input);

      const res = await fetch(api.dictionary.saved.create.path, {
        method: api.dictionary.saved.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.dictionary.saved.create.responses[400], await res.json(), "words.create 400");
          throw new Error(err.message);
        }
        throw new Error("Failed to save word");
      }

      return parseWithLogging(api.dictionary.saved.create.responses[201], await res.json(), "words.create 201");
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
          const err = parseWithLogging(api.dictionary.saved.delete.responses[404], await res.json(), "words.delete 404");
          throw new Error(err.message);
        }
        throw new Error("Failed to delete word");
      }

      // 204 no content
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
    mutationKey: [api.dictionary.tts.speak.path],
    mutationFn: async (input: z.infer<typeof api.dictionary.tts.speak.input>) => {
      const validated = api.dictionary.tts.speak.input.parse(input);

      const res = await fetch(api.dictionary.tts.speak.path, {
        method: api.dictionary.tts.speak.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.dictionary.tts.speak.responses[400], await res.json(), "tts.speak 400");
          throw new Error(err.message);
        }
        throw new Error("Failed to generate speech audio");
      }

      return parseWithLogging(api.dictionary.tts.speak.responses[200], await res.json(), "tts.speak 200");
    },
  });
}
