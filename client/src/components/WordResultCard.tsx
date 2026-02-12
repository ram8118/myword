import { Volume2, Bookmark, Check, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Word } from "@shared/schema";
import { cn } from "@/lib/utils";

interface WordResultCardProps {
  word: Word;
  onSave: () => void;
  savePending?: boolean;
  isSaved?: boolean;
  onPronounce: () => void;
  pronouncePending?: boolean;
  className?: string;
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
  const meanings = (word.meanings as any[]) || [];
  const phrases = (word.phrases as any[]) || [];
  const translation = (word.translation as any) || {};
  const origin = (word.originDetails as any) || {};

  return (
    <Card className={cn("border-none shadow-none bg-background text-foreground", className)} data-testid="card-dictionary-result">
      <CardHeader className="px-0 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex gap-4 items-start">
             <Button
                size="icon"
                variant="outline"
                className="rounded-full h-12 w-12 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                onClick={onPronounce}
                disabled={pronouncePending}
              >
                <Volume2 className={cn("h-6 w-6", pronouncePending && "animate-pulse")} />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-medium tracking-tight">{word.word}</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-8 w-8", isSaved && "text-primary")}
                    onClick={onSave}
                    disabled={savePending}
                  >
                    {isSaved ? <Check className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-lg text-primary/80 font-mono mt-1">{word.ipa}</p>
              </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Translate to</span>
              <Select defaultValue="kannada">
                <SelectTrigger className="w-[120px] bg-secondary/50 border-none h-8 text-xs">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kannada">Kannada</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {translation.others && (
              <div className="text-right space-y-1 mt-2">
                {translation.others.map((t: string, i: number) => (
                  <div key={i} className="text-lg font-medium">{i + 1}. {t}</div>
                ))}
              </div>
            )}
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

          <TabsContent value="overview" className="pt-6 space-y-8">
            {meanings.map((m, idx) => (
              <div key={idx} className="space-y-4">
                <div className="text-primary font-medium italic text-sm">{m.partOfSpeech}</div>
                <div className="space-y-6">
                  {m.definitions.map((d: any, dIdx: number) => (
                    <div key={dIdx} className="space-y-2">
                      <div className="flex gap-3">
                        <span className="text-muted-foreground font-medium">{dIdx + 1}.</span>
                        <div className="flex-1 space-y-2">
                          <div className="text-lg leading-relaxed">{d.definition}</div>
                          {d.example && (
                            <div className="text-muted-foreground italic">"{d.example}"</div>
                          )}
                          
                          {d.subs && d.subs.map((s: any, sIdx: number) => (
                            <div key={sIdx} className="flex gap-3 ml-4 mt-2">
                              <span className="text-muted-foreground">•</span>
                              <div className="flex-1 space-y-1">
                                <div className="text-sm text-foreground/90">{s.definition}</div>
                                {s.example && <div className="text-xs text-muted-foreground italic">"{s.example}"</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {phrases.length > 0 && (
              <div className="pt-8 border-t border-border/50">
                <h3 className="text-xl font-medium mb-4">Phrases</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-2">
                  {phrases.map((p, i) => (
                    <Card key={i} className="p-4 bg-secondary/20 border-border/50">
                      <div className="font-medium text-primary underline underline-offset-4 mb-2">{p.phrase}</div>
                      <div className="text-sm text-foreground mb-1">{p.meaning}</div>
                      <div className="text-xs text-muted-foreground italic">"{p.example}"</div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {origin.text && (
              <div className="pt-8 border-t border-border/50">
                <h3 className="text-xl font-medium mb-6">Origin</h3>
                {origin.flow && (
                   <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-4">
                     {origin.flow.map((step: string, i: number) => (
                       <div key={i} className="flex items-center gap-4">
                         <Badge variant={i === origin.flow.length - 1 ? "secondary" : "outline"} className="px-3 py-1 uppercase text-[10px] tracking-widest whitespace-nowrap">
                           {step}
                         </Badge>
                         {i < origin.flow.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                       </div>
                     ))}
                   </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{origin.text}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="usage" className="pt-6">
            <div className="space-y-4">
               {meanings.map((m, i) => (
                 <div key={i} className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">{m.partOfSpeech}</h4>
                    {m.definitions.map((d: any, j: number) => d.example && (
                      <div key={j} className="p-3 bg-secondary/10 rounded-lg italic">"{d.example}"</div>
                    ))}
                 </div>
               ))}
            </div>
          </TabsContent>

          <TabsContent value="similar" className="pt-6">
             <div className="space-y-8">
               {meanings.map((m, i) => (m.synonyms?.length > 0 || m.antonyms?.length > 0) && (
                 <div key={i} className="space-y-4">
                    <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">{m.partOfSpeech}</h4>
                    {m.synonyms?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-medium text-muted-foreground mr-2">Similar:</span>
                        {m.synonyms.map((s: string) => (
                          <Badge key={s} variant="outline" className="rounded-full px-4 py-1 border-border/50">{s}</Badge>
                        ))}
                      </div>
                    )}
                 </div>
               ))}
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
