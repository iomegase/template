import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const protectedPaths = ["/admin", "/super-admin", "/customer", "/dashboard"]

function isProtected(pathname: string) {
  return protectedPaths.some((p) => pathname.startsWith(p))
}

export default auth(function middleware(req: NextRequest & { auth: import("next-auth").Session | null }) {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get("host") ?? ""
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000"

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
