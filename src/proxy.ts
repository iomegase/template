/**
 * Edge-compatible proxy (Next.js 16 replaces middleware.ts).
 *
 * IMPORTANT: Do NOT import from @/lib/auth here — it pulls in Prisma which
 * uses Node.js modules (node:path, node:url, crypto) that are forbidden in
 * the Edge Runtime. Use NextAuth(authConfig) with the lightweight auth.config
 * (no DB adapter, no Prisma) instead.
 */
import NextAuth from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

const protectedPaths = ["/admin", "/super-admin", "/customer", "/dashboard"]

function isProtected(pathname: string) {
  return protectedPaths.some((p) => pathname.startsWith(p))
}

export default auth(function proxy(
  req: NextRequest & { auth: import("next-auth").Session | null }
) {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get("host") ?? ""
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000"

  // Multi-tenant subdomain rewrite: [slug].domain → /site/[slug]
  const isSubdomain =
    hostname !== rootDomain &&
    hostname !== `app.${rootDomain}` &&
    hostname.endsWith(`.${rootDomain}`)

  if (isSubdomain) {
    const slug = hostname.replace(`.${rootDomain}`, "")
    const url = req.nextUrl.clone()
    url.pathname = `/site/${slug}${pathname}`
    return NextResponse.rewrite(url)
  }

  // Auth guard for admin/dashboard routes
  if (isProtected(pathname) && !req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
