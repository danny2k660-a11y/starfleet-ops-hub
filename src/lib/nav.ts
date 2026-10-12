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
  ShieldCheck,
  Archive,
  FolderKanban,
  Coins,
  Palette,
  Activity,
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
  { to: "/builds", label: "Space Builds", icon: Wrench },
  { to: "/ground-builds", label: "Ground Builds", icon: ShieldCheck },
  { to: "/equipment", label: "Equipment", icon: Shield },
  { to: "/inventory", label: "Inventory", icon: Archive },
  { to: "/traits", label: "Traits", icon: Sparkles },
  { to: "/bridge-officers", label: "Bridge Officers", icon: UsersRound },
  { to: "/reputation", label: "Reputation", icon: Activity },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/resources", label: "Resources", icon: Coins },
  { to: "/themes", label: "Themes", icon: Palette },
  { to: "/settings", label: "Settings", icon: Settings },
];