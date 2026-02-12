import { useMemo, useState } from "react";
import { BookmarkPlus, Check, Sparkles, Volume2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import type { WordResponse } from "@shared/routes";

export default function WordResultCard({
  word,
  fromCache,
  onSave,
  savePending,
  isSaved,
  onPronounce,
  pronouncePending,
  accentLabel,
  "data-testid": testId,
}: {
  word: WordResponse;
  fromCache?: boolean;
  onSave: () => void;
  savePending?: boolean;
  isSaved?: boolean;
  onPronounce: () => void;
  pronouncePending?: boolean;
  accentLabel?: string;
  "data-testid"?: string;
}) {
  const [synOpen, setSynOpen] = useState(false);
  const [antOpen, setAntOpen] = useState(false);

  const synonyms = useMemo(
    () => word.synonyms.split(",").map((s) => s.trim()).filter(Boolean),
    [word.synonyms],
  );
  const antonyms = useMemo(
    () => word.antonyms.split(",").map((s) => s.trim()).filter(Boolean),
    [word.antonyms],
  );

  return (
    <GlassCard data-testid={testId} className="overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
                {word.word}
              </h2>
              {fromCache !== undefined ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                    fromCache
                      ? "border-primary/25 bg-primary/10 text-foreground"
                      : "border-accent/25 bg-accent/12 text-foreground",
                  )}
                  data-testid="lookup-cache-badge"
                  title={fromCache ? "Served from saved cache" : "Fresh AI result"}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {fromCache ? "Cached" : "AI"}
                </span>
              ) : null}
              {accentLabel ? (
                <span
                  className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                  data-testid="accent-label"
                >
                  {accentLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {word.ipa ? (
                <span className="font-semibold text-muted-foreground" data-testid="word-ipa">
                  /{word.ipa}/
                </span>
              ) : (
                <span className="text-muted-foreground" data-testid="word-ipa-empty">
                  IPA unavailable
                </span>
              )}
              {word.partOfSpeech ? (
                <span
                  className="inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground"
                  data-testid="word-pos"
                >
                  {word.partOfSpeech}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:pt-1">
            <button
              onClick={onPronounce}
              data-testid="btn-pronounce"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold",
                "bg-card/60 backdrop-blur-xl soft-shadow",
                "border-border/70 text-foreground",
                "hover:-translate-y-0.5 hover:soft-shadow-lg hover:bg-card",
                "active:translate-y-0 active:soft-shadow",
                "transition-all duration-200 ease-out ring-focus",
                pronouncePending ? "opacity-70 cursor-wait" : "",
              )}
              disabled={pronouncePending}
              aria-label="Pronounce"
            >
              <Volume2 className="h-4 w-4 text-primary" />
              {pronouncePending ? "Speaking…" : "Pronounce"}
            </button>

            <button
              onClick={onSave}
              data-testid="btn-save"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold",
                "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                "shadow-lg shadow-primary/25",
                "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
                "active:translate-y-0 active:shadow-md",
                "transition-all duration-200 ease-out ring-focus",
                (savePending || isSaved) ? "opacity-80" : "",
              )}
              disabled={savePending || isSaved}
              aria-label="Save word"
            >
              {isSaved ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
              {isSaved ? "Saved" : savePending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/60 via-card/50 to-accent/10 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Definition</div>
            <p className="mt-2 text-base leading-relaxed text-foreground" data-testid="word-definition">
              {word.definition}
            </p>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Example</div>
            </div>
            {word.example ? (
              <blockquote
                className="mt-2 rounded-2xl border border-border/60 bg-muted/50 px-4 py-3 text-sm italic leading-relaxed text-foreground"
                data-testid="word-example"
              >
                “{word.example}”
              </blockquote>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground" data-testid="word-example-empty">
                No example provided.
              </p>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Synonyms</div>
                <button
                  onClick={() => setSynOpen((v) => !v)}
                  data-testid="toggle-synonyms"
                  className="rounded-xl border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors ring-focus"
                >
                  {synOpen ? "Collapse" : "Expand"}
                </button>
              </div>

              {synonyms.length ? (
                <div
                  className={cn("mt-3 flex flex-wrap gap-2", synOpen ? "" : "max-h-16 overflow-hidden")}
                  data-testid="word-synonyms"
                >
                  {synonyms.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground" data-testid="word-synonyms-empty">
                  None listed.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/50 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Antonyms</div>
                <button
                  onClick={() => setAntOpen((v) => !v)}
                  data-testid="toggle-antonyms"
                  className="rounded-xl border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors ring-focus"
                >
                  {antOpen ? "Collapse" : "Expand"}
                </button>
              </div>

              {antonyms.length ? (
                <div
                  className={cn("mt-3 flex flex-wrap gap-2", antOpen ? "" : "max-h-16 overflow-hidden")}
                  data-testid="word-antonyms"
                >
                  {antonyms.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full border border-accent/25 bg-accent/12 px-2.5 py-1 text-xs font-semibold text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground" data-testid="word-antonyms-empty">
                  None listed.
                </p>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/60 via-card/40 to-primary/10 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Usage tips</div>
            {word.usageTips ? (
              <p className="mt-2 text-sm leading-relaxed text-foreground" data-testid="word-usage-tips">
                {word.usageTips}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground" data-testid="word-usage-tips-empty">
                No usage tips provided.
              </p>
            )}
          </section>
        </div>
      </div>

      <div className="border-t border-border/60 bg-muted/30 px-6 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Generated <span className="font-semibold text-foreground">just for you</span> — double-check nuance for formal writing.
          </div>
          <div className="text-xs text-muted-foreground" data-testid="word-timestamp">
            Updated: {word.timestamp ? new Date(word.timestamp as any).toLocaleString() : "—"}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
