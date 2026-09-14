"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./navItems";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface-raised pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-ink-muted aria-[current=page]:text-ink-primary"
              >
                <span className={cn("flex size-9 items-center justify-center rounded-full transition-colors duration-[var(--duration-feedback)]", active && "bg-action/10")}>
                  <Icon size={20} className={cn(active && "text-action")} />
                </span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
