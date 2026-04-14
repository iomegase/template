"use client"

import Link from "next/link"
import { useRef } from "react"

import { logout } from "@/features/auth/actions"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  EllipsisVerticalIcon,
  CircleUserRoundIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  Settings2Icon,
} from "lucide-react"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    initials: string
    roleLabel: string
    homeHref: string
    settingsHref: string
  }
}) {
  const { isMobile } = useSidebar()
  const logoutFormRef = useRef<HTMLFormElement>(null)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="rounded-[1.2rem] border border-white/8 bg-white/4 px-3 aria-expanded:bg-white/8"
              />
            }
          >
            <Avatar className="size-8 rounded-xl grayscale">
              <AvatarImage src={undefined} alt={user.name} />
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-foreground/70">
                {user.email}
              </span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 border-white/8 bg-card"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8">
                    <AvatarImage src={undefined} alt={user.name} />
                    <AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <Badge variant="outline">{user.roleLabel}</Badge>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href={user.homeHref} />}>
                <LayoutDashboardIcon
                />
                Workspace
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={user.settingsHref} />}>
                <Settings2Icon
                />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={user.settingsHref} />}>
                <CircleUserRoundIcon
                />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form ref={logoutFormRef} action={logout}>
              <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
              <DropdownMenuItem
                className={cn(
                  "w-full",
                  "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                )}
                onClick={() => logoutFormRef.current?.requestSubmit()}
              >
                <LogOutIcon
                />
                Log out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
