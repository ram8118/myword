import { z } from "zod";
import { insertWordSchema, words } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const lookupInput = z.object({
  word: z.string().min(1),
});

const wordResponse = z.custom<typeof words.$inferSelect>();

export const api = {
  dictionary: {
    lookup: {
      method: "POST" as const,
      path: "/api/dictionary/lookup" as const,
      input: lookupInput,
      responses: {
        200: z.object({
          result: wordResponse,
          fromCache: z.boolean(),
        }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    saved: {
      list: {
        method: "GET" as const,
        path: "/api/words" as const,
        responses: {
          200: z.array(wordResponse),
        },
      },
      get: {
        method: "GET" as const,
        path: "/api/words/:word" as const,
        responses: {
          200: wordResponse,
          404: errorSchemas.notFound,
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/words" as const,
        input: insertWordSchema,
        responses: {
          201: wordResponse,
          400: errorSchemas.validation,
        },
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/words/:word" as const,
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      },
    },
    history: {
      list: {
        method: "GET" as const,
        path: "/api/search-history" as const,
        input: z
          .object({
            limit: z.coerce.number().int().positive().max(50).optional(),
          })
          .optional(),
        responses: {
          200: z.array(
            z.object({
              id: z.number(),
              word: z.string(),
              searchedAt: z.string(),
            })
          ),
        },
      },
    },
    tts: {
      speak: {
        method: "POST" as const,
        path: "/api/tts" as const,
        input: z.object({
          text: z.string().min(1).max(80),
        }),
        responses: {
          200: z.object({
            audioBase64: z.string(),
            contentType: z.string(),
          }),
          400: errorSchemas.validation,
        },
      },
    },
  },
} as const;

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
  }
  return url;
}

export type LookupWordInput = z.infer<typeof api.dictionary.lookup.input>;
export type LookupWordResponse = z.infer<
  typeof api.dictionary.lookup.responses[200]
>;
export type WordResponse = z.infer<typeof api.dictionary.saved.get.responses[200]>;
export type SavedWordsResponse = z.infer<
  typeof api.dictionary.saved.list.responses[200]
>;
export type SearchHistoryResponse = z.infer<
  typeof api.dictionary.history.list.responses[200]
>;
