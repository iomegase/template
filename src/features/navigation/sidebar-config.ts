import type { SidebarIconKey } from "@/components/sidebar-icons";
import { getCurrentUserProjectMembership } from "@/features/auth/guards";
import { getRoleHomeRoute } from "@/features/auth/routes";
import {
  roleLabels,
  type AppUserRole,
  type AuthenticatedUser,
} from "@/features/auth/roles";
import { isProjectOperationalStatus } from "@/features/projects/status";
import {
  superAdminAdminsRoute,
  superAdminBaseRoute,
  superAdminProjectsRoute,
  superAdminSettingsRoute,
} from "@/features/super-admin/routes";

export type SidebarNavItem = {
  title: string;
  href: string;
  icon: SidebarIconKey;
  exact?: boolean;
};

export type SidebarUser = {
  name: string;
  email: string;
  initials: string;
  roleLabel: string;
  homeHref: string;
  settingsHref: string;
};

type SidebarConfig = {
  brandName: string;
  shellTitle: string;
  shellDescription: string;
  settingsHref: string;
  mainNav: SidebarNavItem[];
  secondaryNav: SidebarNavItem[];
};

const sidebarConfigs: Record<AppUserRole, SidebarConfig> = {
  super_admin: {
    brandName: "Starter Platform",
    shellTitle: "Super-admin console",
    shellDescription: "Platform controls, project visibility and client admin oversight.",
    settingsHref: superAdminSettingsRoute,
    mainNav: [
      {
        title: "Overview",
        href: superAdminBaseRoute,
        icon: "dashboard",
        exact: true,
      },
      {
        title: "Projects",
        href: superAdminProjectsRoute,
        icon: "projects",
      },
      {
        title: "Admin accounts",
        href: superAdminAdminsRoute,
        icon: "admins",
      },
    ],
    secondaryNav: [
      {
        title: "Settings",
        href: superAdminSettingsRoute,
        icon: "settings",
      },
    ],
  },
  admin: {
    brandName: "Project Console",
    shellTitle: "Admin workspace",
    shellDescription: "Daily operations, project settings and reusable CRUD foundations.",
    settingsHref: "/admin/settings",
    mainNav: [
      {
        title: "Overview",
        href: "/admin",
        icon: "dashboard",
        exact: true,
      },
      {
        title: "Users",
        href: "/admin/users",
        icon: "users",
      },
      {
        title: "Customers",
        href: "/admin/customers",
        icon: "customers",
      },
    ],
    secondaryNav: [
      {
        title: "Settings",
        href: "/admin/settings",
        icon: "settings",
      },
    ],
  },
  customer: {
    brandName: "Customer Portal",
    shellTitle: "Customer workspace",
    shellDescription: "Personal access area kept intentionally separate from the admin back-office.",
    settingsHref: "/customer/settings",
    mainNav: [
      {
        title: "Overview",
        href: "/customer",
        icon: "dashboard",
        exact: true,
      },
      {
        title: "Account",
        href: "/customer/account",
        icon: "account",
      },
    ],
    secondaryNav: [
      {
        title: "Settings",
        href: "/customer/settings",
        icon: "settings",
      },
    ],
  },
};

function getUserInitials(user: Pick<AuthenticatedUser, "name" | "email">) {
  if (user.name) {
    const initials = user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    if (initials) {
      return initials;
    }
  }

  return (user.email?.slice(0, 2) ?? "SD").toUpperCase();
}

export async function buildDashboardShellProps(user: AuthenticatedUser) {
  const config = sidebarConfigs[user.role];
  const membership =
    user.role === "super_admin"
      ? null
      : await getCurrentUserProjectMembership(user.id);
  const project = membership?.project ?? null;
  const isCustomerPortalEnabled =
    user.role !== "customer" ||
    Boolean(
      project &&
        isProjectOperationalStatus(project.status) &&
        project.settings?.customerPortalEnabled,
    );
  const customerPortalFallbackNav: SidebarNavItem[] = [
    {
      title: "Portal status",
      href: "/customer/disabled",
      icon: "settings",
      exact: true,
    },
  ];
  const mainNavBase =
    user.role === "customer" && !isCustomerPortalEnabled
      ? customerPortalFallbackNav
      : config.mainNav;
  const billingEnabled = Boolean(project?.settings?.billingEnabled);
  const shouldShowCustomerBilling =
    user.role === "customer" && isCustomerPortalEnabled && billingEnabled;
  const shouldShowAdminBilling = user.role === "admin" && billingEnabled;
  const mainNav = [...mainNavBase];

  if (shouldShowAdminBilling) {
    mainNav.push({
      title: "Billing",
      href: "/admin/billing",
      icon: "billing",
    });
  }

  if (shouldShowCustomerBilling) {
    mainNav.push({
      title: "Billing",
      href: "/customer/billing",
      icon: "billing",
    });
  }
  const secondaryNav =
    user.role === "customer" && !isCustomerPortalEnabled
      ? []
      : config.secondaryNav;

  return {
    brandName: project?.settings?.siteName ?? project?.name ?? config.brandName,
    title: config.shellTitle,
    description: config.shellDescription,
    mainNav,
    secondaryNav,
    user: {
      name: user.name ?? roleLabels[user.role],
      email: user.email ?? "no-email@example.com",
      initials: getUserInitials(user),
      roleLabel: roleLabels[user.role],
      homeHref: getRoleHomeRoute(user.role),
      settingsHref: config.settingsHref,
    },
  };
}
