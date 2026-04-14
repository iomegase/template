import {
  CircleUserRoundIcon,
  CreditCardIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

export const sidebarIcons = {
  dashboard: LayoutDashboardIcon,
  projects: FolderKanbanIcon,
  users: UsersIcon,
  customers: CircleUserRoundIcon,
  admins: ShieldCheckIcon,
  account: CircleUserRoundIcon,
  billing: CreditCardIcon,
  settings: Settings2Icon,
} as const;

export type SidebarIconKey = keyof typeof sidebarIcons;
