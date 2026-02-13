import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Bookmark, SearchX, Trash2 } from "lucide-react";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import EmptyState from "@/components/EmptyState";
import LoadingCard from "@/components/LoadingCard";
import { cn } from "@/lib/utils";
import { useDeleteSavedWord, useSavedWords } from "@/hooks/use-dictionary";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Saved() {
  const { toast } = useToast();
  const saved = useSavedWords();
  const del = useDeleteSavedWord();

  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = saved.data ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((w) => {
      const firstDef = ((w.meanings as any[])?.[0]?.definitions?.[0]?.definition || "") as string;
      return w.word.toLowerCase().includes(query) || firstDef.toLowerCase().includes(query);
    });
  }, [q, saved.data]);

  async function confirmDelete(word: string) {
    del.mutate(word, {
      onSuccess: () => {
        toast({ title: "Deleted", description: `Removed “${word}” from Saved.` });
        setToDelete(null);
      },
      onError: (e) => {
        toast({
          title: "Couldn’t delete",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      },
    });
  }

  return (
    <>
      <Seo
        title="Saved words — AI English Dictionary"
        description="Your saved vocabulary list. Revisit words, review definitions, and delete entries you no longer need."
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Saved words</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Build a personal mini-dictionary you actually use.
          </p>
        </div>

        <div className="hidden sm:grid h-12 w-12 place-items-center rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-accent/15 soft-shadow">
          <Bookmark className="h-6 w-6 text-primary" />
        </div>
      </div>

      <GlassCard className="mt-5 p-4 sm:p-5" data-testid="saved-search-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="saved-search">
              Filter
            </label>
            <input
              id="saved-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search saved words…"
              data-testid="saved-filter-input"
              className={cn(
                "mt-2 w-full rounded-2xl border-2 border-border bg-background/60 px-4 py-3",
                "text-sm font-semibold text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200",
              )}
            />
          </div>

          <button
            type="button"
            onClick={() => setQ("")}
            data-testid="clear-filter"
            className={cn(
              "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-bold",
              "border-border/70 bg-card/60 soft-shadow",
              "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow-lg",
              "active:translate-y-0 active:soft-shadow",
              "transition-all duration-200 ease-out ring-focus",
              !q.trim() ? "opacity-60 cursor-not-allowed hover:translate-y-0" : "",
            )}
            disabled={!q.trim()}
          >
            Clear
          </button>
        </div>
      </GlassCard>

      <div className="mt-5">
        {saved.isLoading ? (
          <div className="grid gap-4" data-testid="saved-loading">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : saved.isError ? (
          <EmptyState
            data-testid="saved-error"
            icon={<SearchX className="h-6 w-6 text-destructive" />}
            title="Couldn’t load your saved words"
            description={(saved.error as any)?.message ?? "Try again in a moment."}
            actions={
              <button
                onClick={() => saved.refetch()}
                data-testid="saved-retry"
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
        ) : (saved.data?.length ?? 0) === 0 ? (
          <EmptyState
            data-testid="saved-empty"
            icon={<Bookmark className="h-6 w-6 text-primary" />}
            title="No saved words yet"
            description="Save your first word from Home. Your favorites will show up here."
            actions={
              <Link
                href="/"
                data-testid="saved-go-home"
                className={cn(
                  "rounded-2xl px-5 py-2.5 text-sm font-bold",
                  "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                  "shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all ring-focus",
                )}
              >
                Go to Home
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            data-testid="saved-filter-empty"
            icon={<SearchX className="h-6 w-6 text-muted-foreground" />}
            title="No matches"
            description="Try a different search term—or clear the filter."
            actions={
              <button
                onClick={() => setQ("")}
                data-testid="saved-clear-from-empty"
                className={cn(
                  "rounded-2xl border border-border/70 bg-card/60 px-5 py-2.5 text-sm font-bold",
                  "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow-lg active:translate-y-0 transition-all ring-focus",
                )}
              >
                Clear filter
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="saved-grid">
            {filtered.map((w) => (
              <GlassCard key={w.word} className="p-5" data-testid={`saved-card-${w.word}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/detail/${encodeURIComponent(w.word)}`}
                      className={cn(
                        "block rounded-xl ring-focus",
                        "text-lg font-bold text-foreground hover:underline underline-offset-4 decoration-primary/50",
                      )}
                      data-testid={`saved-open-${w.word}`}
                    >
                      {w.word}
                    </Link>
                    <div className="mt-2 line-clamp-3 text-sm text-muted-foreground" data-testid={`saved-def-${w.word}`}>
                      {((w.meanings as any[])?.[0]?.definitions?.[0]?.definition) || "No definition"}
                    </div>
                  </div>

                  <AlertDialog
                    open={toDelete === w.word}
                    onOpenChange={(open) => setToDelete(open ? w.word : null)}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setToDelete(w.word)}
                        data-testid={`saved-delete-${w.word}`}
                        className={cn(
                          "inline-flex h-10 w-10 items-center justify-center rounded-2xl border",
                          "border-destructive/25 bg-destructive/10 text-destructive",
                          "hover:bg-destructive/15 hover:-translate-y-0.5 hover:soft-shadow",
                          "active:translate-y-0",
                          "transition-all duration-200 ease-out ring-focus",
                        )}
                        aria-label={`Delete ${w.word}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>

                    <AlertDialogContent data-testid="delete-dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{w.word}”?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes it from your Saved list. You can always look it up again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setToDelete(null)}
                          data-testid="delete-cancel"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void confirmDelete(w.word)}
                          data-testid="delete-confirm"
                          className={cn(
                            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                          )}
                          disabled={del.isPending}
                        >
                          {del.isPending ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground" data-testid={`saved-meta-${w.word}`}>
                    {(w.meanings as any[])?.[0]?.partOfSpeech ? <span className="font-semibold text-foreground">{(w.meanings as any[])[0].partOfSpeech}</span> : "—"}
                    {w.ipa ? <span className="ml-2">/{w.ipa}/</span> : null}
                  </div>
                  <Link
                    href={`/detail/${encodeURIComponent(w.word)}`}
                    data-testid={`saved-view-${w.word}`}
                    className={cn(
                      "rounded-2xl border border-border/70 bg-card/60 px-3 py-2 text-xs font-bold text-foreground",
                      "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow",
                      "transition-all duration-200 ease-out ring-focus",
                    )}
                  >
                    View
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
