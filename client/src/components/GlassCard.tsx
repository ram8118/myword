import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function GlassCard({
  children,
  className,
  "data-testid": testId,
}: {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "grain rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl",
        "soft-shadow",
        "transition-all duration-300 ease-out",
        "hover:soft-shadow-lg hover:border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
