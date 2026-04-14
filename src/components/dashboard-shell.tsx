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
          "--sidebar-width": "18rem",
          "--header-height": "4.5rem",
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
      <SidebarInset className="flex min-h-svh flex-col overflow-hidden border border-white/6 bg-transparent shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
        <SiteHeader
          title={title}
          description={description}
          className="px-4 md:px-6"
        />
        <div className="flex flex-1 flex-col">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(200,0,110,0.12),transparent_32%),radial-gradient(circle_at_left,rgba(134,143,92,0.12),transparent_24%),linear-gradient(180deg,rgba(17,17,14,0.98),rgba(10,10,8,1))]" />
          <main className="@container/main flex-1 p-4 md:p-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
              {children}
            </div>
          </main>
          <footer className="border-t border-white/6 px-4 py-4 text-xs text-muted-foreground md:px-6">
            {brandName} starter workspace de
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
