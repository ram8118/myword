import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Bookmark, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("aed_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("aed_theme", theme);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  const nav = useMemo(
    () => [
      { href: "/", label: "Home", icon: BookOpen, testId: "nav-home" },
      { href: "/saved", label: "Saved", icon: Bookmark, testId: "nav-saved" },
    ],
    [],
  );

  const activeHref = location.startsWith("/saved") ? "/saved" : location.startsWith("/detail/") ? "/saved" : "/";

  return (
    <div className="min-h-dvh bg-mesh">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-80">
        <div className="absolute inset-x-0 -top-24 h-72 bg-gradient-to-b from-primary/18 to-transparent blur-3xl" />
        <div className="absolute inset-x-0 -bottom-24 h-72 bg-gradient-to-t from-accent/14 to-transparent blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-2xl px-2 py-1 ring-focus transition-all"
              data-testid="brand"
            >
              <div
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-2xl",
                  "bg-gradient-to-br from-primary/18 via-card to-accent/18",
                  "border border-border/60 soft-shadow",
                  "transition-transform duration-300 ease-out group-hover:-translate-y-0.5",
                )}
              >
                <span className="text-lg font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
                  A
                </span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">AI English Dictionary</div>
                <div className="text-xs text-muted-foreground">Look up. Learn. Save.</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className={cn(
                  "group relative inline-flex h-10 items-center gap-2 rounded-2xl border border-border/70",
                  "bg-card/60 px-3 text-sm font-semibold text-foreground soft-shadow",
                  "hover:bg-card hover:-translate-y-0.5 hover:soft-shadow-lg",
                  "active:translate-y-0 active:soft-shadow",
                  "transition-all duration-200 ease-out ring-focus",
                )}
                data-testid="toggle-theme"
                aria-label="Toggle theme"
              >
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-muted to-card border border-border/60">
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </span>
                <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
                <span className="sr-only">Toggle theme</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="animate-float-in">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-2 py-3">
            {nav.map((item) => {
              const active = activeHref === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.testId}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out ring-focus",
                    active
                      ? "border-primary/30 bg-gradient-to-br from-primary/14 via-card to-accent/10 text-foreground soft-shadow"
                      : "border-border/70 bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground hover:-translate-y-0.5 hover:soft-shadow",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute -top-[2px] left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
