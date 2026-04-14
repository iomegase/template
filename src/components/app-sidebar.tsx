"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type {
  SidebarNavItem,
  SidebarUser,
} from "@/features/navigation/sidebar-config"
import { CommandIcon, MenuIcon } from "lucide-react"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  brandName: string
  mainNav: SidebarNavItem[]
  secondaryNav: SidebarNavItem[]
  user: SidebarUser
}

export function AppSidebar({
  brandName,
  mainNav,
  secondaryNav,
  user,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="gap-4 border-b border-white/6 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-14 rounded-[1.2rem] border border-white/8 bg-white/4 px-3 data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href={user.homeHref} />}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(201,0,105,0.28)]">
                <CommandIcon className="size-4!" />
              </div>
              <div className="flex flex-1 flex-col text-left">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Menu
                </span>
                <span className="text-base font-semibold">{brandName}</span>
              </div>
              <MenuIcon className="size-5 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} />
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
