import {
  LayoutDashboard,
  Users,
  Rocket,
  Wrench,
  Shield,
  Sparkles,
  UsersRound,
  Database,
  Settings,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

import type { LinkProps } from "@tanstack/react-router";

export type NavItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/characters", label: "Characters", icon: Users },
  { to: "/ships", label: "Ships", icon: Rocket },
  { to: "/ship-planner", label: "Ship Planner", icon: ClipboardList },
  { to: "/ship-database", label: "Ship Database", icon: Database },
  { to: "/builds", label: "Builds", icon: Wrench },
  { to: "/equipment", label: "Equipment", icon: Shield },
  { to: "/traits", label: "Traits", icon: Sparkles },
  { to: "/bridge-officers", label: "Bridge Officers", icon: UsersRound },
  { to: "/settings", label: "Settings", icon: Settings },
];