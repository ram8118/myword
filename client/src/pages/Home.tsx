import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { BookOpen, History, Search, Sparkles, TriangleAlert } from "lucide-react";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import WordResultCard from "@/components/WordResultCard";
import LoadingCard from "@/components/LoadingCard";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useCreateSavedWord,
  useLookupWord,
  useSavedWords,
  useSearchHistory,
  useSpeakTts,
} from "@/hooks/use-dictionary";

export default function Home() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [lastWord, setLastWord] = useState<string>("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const lookup = useLookupWord();
  const saved = useSavedWords();
  const history = useSearchHistory(5);
  const saveWord = useCreateSavedWord();
  const speak = useSpeakTts();

  const savedSet = useMemo(() => new Set((saved.data ?? []).map((w) => w.word.toLowerCase())), [saved.data]);

  const activeResult = lookup.data?.result;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  async function doLookup(wordRaw: string) {
    const word = wordRaw.trim();
    if (!word) return;

    setLastWord(word);

    lookup.mutate(
      { word },
      {
        onError: (e) => {
          toast({
            title: "Couldn't look that up",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void doLookup(query);
  }

  function handleClickHistoryWord(w: string) {
    setQuery(w);
    void doLookup(w);
  }

  async function handleSave() {
    if (!activeResult) return;

    saveWord.mutate(activeResult as any, {
      onSuccess: () => {
        toast({
          title: "Saved",
          description: `"${activeResult?.word}" is now in your Saved list.`,
        });
      },
      onError: (e) => {
        toast({
          title: "Couldn't save",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      },
    });
  }

  async function handlePronounce() {
    const target = activeResult?.word || lastWord || query.trim();
    if (!target) return;

    speak.mutate(
      { text: target },
      {
        onSuccess: () => {
          toast({
            title: "Pronouncing",
            description: `Playing pronunciation for "${target}".`,
          });
        },
        onError: (e) => {
          toast({
            title: "Couldn't generate audio",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <>
      <Seo
        title="AI English Dictionary - Look up & learn"
        description="A modern AI-powered English dictionary. Search words, get definitions, examples, synonyms, antonyms, and usage tips. Save words and revisit anytime."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
                Find the <span className="text-primary">right</span> word.
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground text-balance">
                Definitions with nuance, examples you can steal, and tips for natural usage.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                AI assisted
              </span>
            </div>
          </div>

          <GlassCard className="p-4 sm:p-5" data-testid="search-card">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a word (e.g., 'serendipity')"
                  data-testid="search-input"
                  className={cn(
                    "w-full rounded-2xl border-2 border-border bg-background/60 px-11 py-3.5",
                    "text-base font-semibold text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                    "transition-all duration-200",
                  )}
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    AI
                  </span>
                </div>
              </div>

              <button
                type="submit"
                data-testid="search-button"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold",
                  "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                  "shadow-lg shadow-primary/25",
                  "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
                  "active:translate-y-0 active:shadow-md",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
                  "transition-all duration-200 ease-out ring-focus",
                )}
                disabled={lookup.isPending || !query.trim()}
              >
                {lookup.isPending ? "Searching..." : "Search"}
              </button>

              <button
                type="button"
                onClick={handlePronounce}
                data-testid="pronounce-from-search"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold",
                  "border-border/70 bg-card/60 soft-shadow",
                  "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow-lg",
                  "active:translate-y-0 active:soft-shadow",
                  "transition-all duration-200 ease-out ring-focus",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
                )}
                disabled={speak.isPending || !(activeResult?.word || query.trim())}
              >
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-primary/15 via-card to-accent/15 border border-border/60">
                  <BookOpen className="h-4 w-4 text-primary" />
                </span>
                {speak.isPending ? "Preparing..." : "Pronounce"}
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div data-testid="search-hint">
                Tip: Try phrases like <span className="font-semibold text-foreground">"by and large"</span> or{" "}
                <span className="font-semibold text-foreground">"on the fence"</span>.
              </div>
              <div className="hidden sm:block" data-testid="search-status">
                {lookup.isPending ? "Thinking..." : lookup.data ? "Ready." : "-"}
              </div>
            </div>
          </GlassCard>

          {lookup.isPending ? (
            <LoadingCard data-testid="lookup-loading" />
          ) : lookup.isError ? (
            <EmptyState
              data-testid="lookup-error"
              icon={<TriangleAlert className="h-6 w-6 text-destructive" />}
              title="We couldn't fetch that definition"
              description={(lookup.error as any)?.message ?? "Try again in a moment."}
              actions={
                <button
                  onClick={() => void doLookup(query)}
                  data-testid="retry-lookup"
                  className={cn(
                    "rounded-2xl px-5 py-2.5 text-sm font-bold",
                    "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                    "shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all ring-focus",
                  )}
                >
                  Retry
                </button>
              }
            />
          ) : lookup.data?.result ? (
            <WordResultCard
              data-testid="word-result-card"
              word={lookup.data.result}
              onSave={handleSave}
              savePending={saveWord.isPending}
              isSaved={savedSet.has(lookup.data.result.word.toLowerCase())}
              onPronounce={handlePronounce}
              pronouncePending={speak.isPending}
            />
          ) : (
            <EmptyState
              data-testid="lookup-empty"
              icon={<Sparkles className="h-6 w-6 text-primary" />}
              title="Start with a word"
              description="Search anything - single words, expressions, or that perfect adjective you can't quite remember."
              actions={
                <button
                  onClick={() => inputRef.current?.focus()}
                  data-testid="focus-search"
                  className={cn(
                    "rounded-2xl border border-border/70 bg-card/60 px-5 py-2.5 text-sm font-bold",
                    "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow-lg active:translate-y-0 transition-all ring-focus",
                  )}
                >
                  Focus search
                </button>
              }
            />
          )}
        </section>

        <aside className="space-y-5">
          <GlassCard className="p-5 sm:p-6" data-testid="history-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Recent searches</h2>
                <p className="mt-1 text-sm text-muted-foreground">Tap to revisit instantly.</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-accent/15">
                <History className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="mt-4">
              {history.isLoading ? (
                <div className="space-y-2" data-testid="history-loading">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-2xl skeleton-shimmer" />
                  ))}
                </div>
              ) : history.isError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4" data-testid="history-error">
                  <div className="text-sm font-bold text-foreground">Couldn't load history</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(history.error as any)?.message ?? "Try again later."}
                  </div>
                </div>
              ) : (history.data?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4" data-testid="history-empty">
                  <div className="text-sm font-semibold text-foreground">No history yet</div>
                  <div className="mt-1 text-xs text-muted-foreground">Your last 5 searches will appear here.</div>
                </div>
              ) : (
                <div className="space-y-2" data-testid="history-list">
                  {history.data!.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleClickHistoryWord(item.word)}
                      data-testid={`history-item-${item.id}`}
                      className={cn(
                        "group flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3 text-left",
                        "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow",
                        "active:translate-y-0",
                        "transition-all duration-200 ease-out ring-focus",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-foreground">{item.word}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(item.searchedAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="rounded-xl border border-border/60 bg-muted/50 px-2 py-1 text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                        Lookup
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6" data-testid="saved-preview-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Saved words</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your personal vocabulary vault.</p>
              </div>
              <Link
                href="/saved"
                data-testid="go-saved"
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-bold",
                  "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                  "shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all ring-focus",
                )}
              >
                Open
              </Link>
            </div>

            <div className="mt-4">
              {saved.isLoading ? (
                <div className="space-y-2" data-testid="saved-preview-loading">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-2xl skeleton-shimmer" />
                  ))}
                </div>
              ) : saved.isError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4" data-testid="saved-preview-error">
                  <div className="text-sm font-bold text-foreground">Couldn't load saved list</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(saved.error as any)?.message ?? "Try again later."}
                  </div>
                </div>
              ) : (saved.data?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4" data-testid="saved-preview-empty">
                  <div className="text-sm font-semibold text-foreground">Nothing saved yet</div>
                  <div className="mt-1 text-xs text-muted-foreground">Save words you want to remember.</div>
                </div>
              ) : (
                <div className="space-y-2" data-testid="saved-preview-list">
                  {saved.data!.slice(0, 3).map((w) => (
                    <Link
                      key={w.word}
                      href={`/detail/${encodeURIComponent(w.word)}`}
                      data-testid={`saved-preview-${w.word}`}
                      className={cn(
                        "group block rounded-2xl border border-border/60 bg-card/50 px-4 py-3",
                        "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow",
                        "transition-all duration-200 ease-out ring-focus",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{w.word}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{((w.meanings as any[])?.[0]?.definitions?.[0]?.definition) || w.ipa || "Saved word"}</div>
                        </div>
                        <span className="rounded-xl border border-border/60 bg-muted/50 px-2 py-1 text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                          View
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </aside>
      </div>
    </>
  );
}
