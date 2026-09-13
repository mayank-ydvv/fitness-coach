import { CalendarCheck, Dumbbell, LineChart, Salad, Sunrise } from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

// Single source of truth for both BottomNav (mobile) and LeftRail (desktop).
export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: Sunrise },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/eat", label: "Eat", icon: Salad },
  { href: "/habits", label: "Habits", icon: CalendarCheck },
  { href: "/progress", label: "Progress", icon: LineChart },
];
