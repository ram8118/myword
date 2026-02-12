import { Volume2, Bookmark, Check } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Word } from "@shared/schema";
import { cn } from "@/lib/utils";

interface WordResultCardProps {
  word: Word;
  fromCache?: boolean;
  onSave: () => void;
  savePending?: boolean;
  isSaved?: boolean;
  onPronounce: () => void;
  pronouncePending?: boolean;
  className?: string;
  accentLabel?: string;
}

export default function WordResultCard({
  word,
  onSave,
  savePending,
  isSaved,
  onPronounce,
  pronouncePending,
  className,
}: WordResultCardProps) {
  return (
    <Card className={cn("border-none shadow-none bg-background text-foreground", className)} data-testid="card-dictionary-result">
      <CardHeader className="px-0 pb-2">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-12 w-12 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors"
            onClick={onPronounce}
            disabled={pronouncePending}
            data-testid="button-pronounce"
          >
            <Volume2 className={cn("h-6 w-6", pronouncePending && "animate-pulse")} />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-medium tracking-tight" data-testid="text-word-title">{word.word}</h2>
              <Button
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8 text-muted-foreground hover:text-primary", isSaved && "text-primary")}
                onClick={onSave}
                disabled={savePending}
                data-testid="button-save-word"
              >
                {isSaved ? <Check className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-lg text-primary/80 font-mono mt-1" data-testid="text-word-ipa">{word.ipa}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Translate to</span>
            <Select defaultValue="hindi">
              <SelectTrigger className="w-[120px] bg-secondary/50 border-none h-8 text-xs">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="kannada">Kannada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="overview" className="w-full mt-4">
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-6">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 text-sm font-medium">Overview</TabsTrigger>
            <TabsTrigger value="usage" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 text-sm font-medium">Usage examples</TabsTrigger>
            <TabsTrigger value="similar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 text-sm font-medium">Similar and opposite words</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-6 space-y-6">
            <div className="space-y-2">
              <div className="text-primary font-medium italic text-sm">{word.partOfSpeech}</div>
              <div className="text-lg leading-relaxed">{word.definition}</div>
              {word.example && (
                <div className="text-muted-foreground italic pl-4 border-l-2 border-primary/20">
                  "{word.example}"
                </div>
              )}
            </div>

            {word.translation && (
              <div className="pt-4 border-t border-border/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Translation</div>
                <div className="text-xl font-medium">{word.translation}</div>
              </div>
            )}

            {word.origin && (
              <div className="pt-4 border-t border-border/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Origin</div>
                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                   <div className="flex items-center gap-2 whitespace-nowrap">
                     <Badge variant="outline" className="px-3 py-1 bg-secondary/30">HISTORY</Badge>
                     <span className="text-muted-foreground">→</span>
                     <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">CURRENT</Badge>
                   </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{word.origin}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="usage" className="pt-6">
             <div className="space-y-4">
               <p className="text-sm text-muted-foreground">How to use "{word.word}" in sentences:</p>
               <ul className="space-y-3 list-disc pl-5">
                 <li className="text-foreground leading-relaxed italic">{word.example}</li>
                 {word.usageTips && <li className="text-foreground leading-relaxed">{word.usageTips}</li>}
               </ul>
             </div>
          </TabsContent>

          <TabsContent value="similar" className="pt-6 space-y-8">
            {word.synonyms && (
              <div>
                <h4 className="text-sm font-medium mb-4 text-muted-foreground">Similar:</h4>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.split(",").map((s) => (
                    <Badge key={s} variant="outline" className="rounded-full px-4 py-1 hover:bg-secondary transition-colors cursor-pointer border-border/50">
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {word.antonyms && (
              <div>
                <h4 className="text-sm font-medium mb-4 text-muted-foreground">Opposite:</h4>
                <div className="flex flex-wrap gap-2">
                  {word.antonyms.split(",").map((a) => (
                    <Badge key={a} variant="outline" className="rounded-full px-4 py-1 hover:bg-secondary transition-colors cursor-pointer border-border/50">
                      {a.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
