import Link from "next/link";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/a11y/SkipLink";
import { BottomNav } from "./BottomNav";
import { LeftRail } from "./LeftRail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-base">
      <SkipLink />
      <LeftRail />
      <div className="lg:ml-60">
        <header className="mx-auto flex max-w-2xl justify-end px-5 pt-4 lg:max-w-4xl">
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink-primary"
          >
            <Settings size={20} aria-hidden />
          </Link>
        </header>
        <main id="main-content" className="mx-auto max-w-2xl px-5 pb-24 pt-2 lg:max-w-4xl lg:pb-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
