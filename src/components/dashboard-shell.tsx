import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type {
  SidebarNavItem,
  SidebarUser,
} from "@/features/navigation/sidebar-config";

type DashboardShellProps = {
  brandName: string;
  title: string;
  description: string;
  mainNav: SidebarNavItem[];
  secondaryNav: SidebarNavItem[];
  user: SidebarUser;
  children: ReactNode;
};

export function DashboardShell({
  brandName,
  title,
  description,
  mainNav,
  secondaryNav,
  user,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider
      className="bg-background"
      style={
        {
          "--sidebar-width": "17rem",
          "--header-height": "4rem",
        } as CSSProperties
      }
    >
      <AppSidebar
        brandName={brandName}
        mainNav={mainNav}
        secondaryNav={secondaryNav}
        user={user}
        variant="inset"
      />
      <SidebarInset className="relative flex min-h-svh flex-col overflow-hidden border border-border/30 bg-transparent shadow-[0_24px_80px_rgba(0,0,0,0.36)]">

        {/* Warm editorial backdrop — amber top-left, sage bottom-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: [
              /* FA6900 vivid orange halo — top left */
              "radial-gradient(ellipse 60% 50% at 0% 0%, oklch(0.67 0.20 46 / 0.07), transparent)",
              /* 69D2E7 sky blue halo — bottom right */
              "radial-gradient(ellipse 50% 40% at 100% 100%, oklch(0.80 0.092 207 / 0.06), transparent)",
              "linear-gradient(180deg, var(--background) 0%, var(--background) 100%)",
            ].join(","),
          }}
        />

        <SiteHeader
          title={title}
          description={description}
          className="px-4 md:px-6"
        />

        <div className="flex flex-1 flex-col">
          <main className="@container/main flex-1 p-4 md:p-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
              {children}
            </div>
          </main>

          <footer className="border-t border-border/30 px-4 py-3 md:px-6">
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground/40">
              {brandName} · starter workspace
            </p>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
