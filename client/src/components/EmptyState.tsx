import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
  "data-testid": testId,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "rounded-3xl border border-border/60 bg-card/60 px-6 py-10 text-center backdrop-blur-xl soft-shadow",
        className,
      )}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 via-card to-accent/15 border border-border/60">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actions ? <div className="mt-5 flex items-center justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
