import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET 
  })
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/api/auth",
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If user is not authenticated, redirect to signin
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Role-based access control
  const userRole = token.role as string
  
  // Owner routes - only accessible by OWNER
  if (pathname.startsWith("/admin") || pathname.startsWith("/users")) {
    if (userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Manager routes - accessible by OWNER and MANAGER
  if (pathname.startsWith("/farms") || pathname.startsWith("/sheds") || pathname.startsWith("/reports")) {
    if (userRole === "WORKER") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // API routes protection
  if (pathname.startsWith("/api/")) {
    // Skip auth API routes
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next()
    }

    // Add organization context to the request headers for multi-tenant filtering
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-organization-id", token.organizationId as string)
    requestHeaders.set("x-user-id", token.sub as string)
    requestHeaders.set("x-user-role", token.role as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}