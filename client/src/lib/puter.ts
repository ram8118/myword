declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          prompt: string | Array<{ role: string; content: string }>,
          options?: {
            model?: string;
            stream?: boolean;
            response_format?: { type: string };
          }
        ) => Promise<any>;
        txt2speech: (
          text: string,
          options?: {
            voice?: string;
            engine?: string;
            language?: string;
            provider?: string;
            model?: string;
          }
        ) => Promise<HTMLAudioElement>;
      };
    };
  }
}

const AI_PROMPT_SYSTEM =
  "You are a professional lexicographer. Return exhaustive, deeply structured JSON mirroring Google's Search Dictionary exactly. Do not skip any meanings. Use nested sub-definitions for variant meanings of the same sense. Use numbering (1., 2., 3.) for distinct senses. Include full part-of-speech forms (e.g., plural noun, verb conjugations). Return ONLY valid JSON.";

function buildLookupPrompt(word: string): string {
  return (
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
  ],
  "phrases": [{ "phrase": "...", "meaning": "...", "example": "..." }],
  "originDetails": { "text": "...", "flow": ["LATIN", "FRENCH", "ENGLISH"] },
  "translation": { "primary": "...", "others": ["..."] }
}`
  );
}

export async function puterAiLookup(word: string): Promise<any> {
  const puter = window.puter;
  if (!puter?.ai?.chat) {
    throw new Error("Puter.js is not loaded. Please refresh the page.");
  }

  const response = await puter.ai.chat(
    [
      { role: "system", content: AI_PROMPT_SYSTEM },
      { role: "user", content: buildLookupPrompt(word) },
    ],
    {
      model: "gpt-4o-mini",
    }
  );

  const text = typeof response === "string" ? response : response?.message?.content || response?.text || JSON.stringify(response);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI returned an invalid response. Please try again.");
  }

  return JSON.parse(jsonMatch[0]);
}

export async function puterTtsSpeak(text: string): Promise<HTMLAudioElement> {
  const puter = window.puter;
  if (!puter?.ai?.txt2speech) {
    throw new Error("Puter.js is not loaded. Please refresh the page.");
  }

  const audio = await puter.ai.txt2speech(text, {
    voice: "Joanna",
    engine: "neural",
    language: "en-US",
  });

  return audio;
}
