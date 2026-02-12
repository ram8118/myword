import { cn } from "@/lib/utils";

export default function LoadingCard({
  lines = 5,
  className,
  "data-testid": testId,
}: {
  lines?: number;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl soft-shadow",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl skeleton-shimmer" />
        <div className="flex-1">
          <div className="h-4 w-40 rounded-lg skeleton-shimmer" />
          <div className="mt-2 h-3 w-28 rounded-lg skeleton-shimmer" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 rounded-lg skeleton-shimmer",
              i % 3 === 0 ? "w-[92%]" : i % 3 === 1 ? "w-[78%]" : "w-[86%]",
            )}
            style={{ animationDelay: `${i * 65}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
