"use client"

import * as React from "react"
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

export function NavSecondary({
  items,
  ...props
}: {
  items: SidebarNavItem[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              >
                {(() => {
                  const Icon = sidebarIcons[item.icon]
                  return <Icon />
                })()}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
