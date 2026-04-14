"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { sidebarIcons } from "@/components/sidebar-icons"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { SidebarNavItem } from "@/features/navigation/sidebar-config"

export function NavMain({
  items,
}: {
  items: SidebarNavItem[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="px-2 py-2">
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const Icon = sidebarIcons[item.icon]

            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  tooltip={item.title}
                  isActive={isActive}
                  className="
                    h-12 rounded-[1.05rem] border border-transparent px-3.5
                    text-[0.95rem] font-medium text-sidebar-foreground/68
                    transition-all duration-200
                    hover:border-white/6 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground
                    data-[active=true]:border-primary/18
                    data-[active=true]:bg-primary/14
                    data-[active=true]:text-sidebar-accent-foreground
                    data-[active=true]:shadow-[0_10px_26px_rgba(201,0,105,0.16)]
                  "
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
