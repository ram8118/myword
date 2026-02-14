import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, BookmarkPlus, Check, TriangleAlert, Volume2 } from "lucide-react";
import Seo from "@/components/Seo";
import GlassCard from "@/components/GlassCard";
import LoadingCard from "@/components/LoadingCard";
import EmptyState from "@/components/EmptyState";
import WordResultCard from "@/components/WordResultCard";
import { cn } from "@/lib/utils";
import { useCreateSavedWord, useSavedWord, useSavedWords, useSpeakTts } from "@/hooks/use-dictionary";
import { useToast } from "@/hooks/use-toast";

export default function WordDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/detail/:word");
  const raw = params?.word ? decodeURIComponent(params.word) : "";
  const wordKey = raw.trim();

  const savedWord = useSavedWord(wordKey);
  const savedList = useSavedWords();
  const save = useCreateSavedWord();
  const speak = useSpeakTts();

  const savedSet = useMemo(() => new Set((savedList.data ?? []).map((w) => w.word.toLowerCase())), [savedList.data]);
  const isSaved = savedSet.has(wordKey.toLowerCase());

  async function handleSave() {
    if (!savedWord.data) return;
    save.mutate(savedWord.data as any, {
      onSuccess: () => toast({ title: "Saved", description: `"${savedWord.data!.word}" is in your Saved list.` }),
      onError: (e) =>
        toast({
          title: "Couldn't save",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        }),
    });
  }

  async function handlePronounce() {
    const target = savedWord.data?.word || wordKey;
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
        onError: (e) =>
          toast({
            title: "Couldn't generate audio",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          }),
      },
    );
  }

  return (
    <>
      <Seo
        title={wordKey ? `${wordKey} - AI English Dictionary` : "Word - AI English Dictionary"}
        description={`Detailed entry for ${wordKey}. Definition, example, synonyms, antonyms, usage tips, and pronunciation.`}
      />

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/saved"
          data-testid="detail-back"
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-4 py-2.5 text-sm font-bold",
            "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow",
            "transition-all duration-200 ease-out ring-focus",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePronounce}
            data-testid="detail-pronounce"
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold",
              "border-border/70 bg-card/60 soft-shadow",
              "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow-lg",
              "active:translate-y-0 active:soft-shadow",
              "transition-all duration-200 ease-out ring-focus",
              speak.isPending ? "opacity-70 cursor-wait" : "",
            )}
            disabled={speak.isPending || !wordKey}
          >
            <Volume2 className="h-4 w-4 text-primary" />
            {speak.isPending ? "Speaking..." : "Pronounce"}
          </button>

          <button
            onClick={handleSave}
            data-testid="detail-save"
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold",
              "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25",
              "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
              "transition-all duration-200 ease-out ring-focus",
              (save.isPending || isSaved) ? "opacity-80" : "",
            )}
            disabled={save.isPending || isSaved || !savedWord.data}
          >
            {isSaved ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
            {isSaved ? "Saved" : save.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        {savedWord.isLoading ? (
          <LoadingCard data-testid="detail-loading" />
        ) : savedWord.isError ? (
          <EmptyState
            data-testid="detail-error"
            icon={<TriangleAlert className="h-6 w-6 text-destructive" />}
            title="Couldn't load this entry"
            description={(savedWord.error as any)?.message ?? "Try again."}
            actions={
              <button
                onClick={() => savedWord.refetch()}
                data-testid="detail-retry"
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
        ) : !savedWord.data ? (
          <EmptyState
            data-testid="detail-not-found"
            icon={<TriangleAlert className="h-6 w-6 text-muted-foreground" />}
            title="Not found"
            description="This word isn't in your Saved list. Try searching it on Home, then save it."
            actions={
              <Link
                href="/"
                data-testid="detail-go-home"
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
        ) : (
          <WordResultCard
            data-testid="detail-word-card"
            word={savedWord.data}
            onSave={handleSave}
            savePending={save.isPending}
            isSaved={isSaved}
            onPronounce={handlePronounce}
            pronouncePending={speak.isPending}
          />
        )}
      </div>
    </>
  );
}
