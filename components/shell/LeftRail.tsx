"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./navItems";

export function LeftRail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-1 border-r border-hairline bg-surface-raised p-4 lg:flex"
    >
      <div className="mb-4 px-2 text-lg font-semibold text-ink-primary">AI Fitness Coach</div>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium text-ink-muted hover:text-ink-primary",
              active && "bg-surface-sunken text-ink-primary",
            )}
          >
            <Icon size={20} className={cn(active && "text-load-blue")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
