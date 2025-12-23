import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ZodError } from "zod"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}

export function createErrorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({
    success: false,
    error,
  }, { status })
}

export async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  return session.user
}

export async function getOrganizationId(request: NextRequest): Promise<string> {
  // First try to get from headers (set by middleware)
  const organizationId = request.headers.get("x-organization-id")
  
  if (organizationId) {
    return organizationId
  }

  // Fallback: get from session if headers not available
  const session = await auth()
  if (session?.user?.organizationId) {
    return session.user.organizationId
  }
  
  throw new Error("Organization context not found")
}

export async function getUserId(request: NextRequest): Promise<string> {
  // First try to get from headers (set by middleware)
  const userId = request.headers.get("x-user-id")
  
  if (userId) {
    return userId
  }

  // Fallback: get from session if headers not available
  const session = await auth()
  if (session?.user?.id) {
    return session.user.id
  }
  
  throw new Error("User context not found")
}

export async function getUserRole(request: NextRequest): Promise<string> {
  // First try to get from headers (set by middleware)
  const userRole = request.headers.get("x-user-role")
  
  if (userRole) {
    return userRole
  }

  // Fallback: get from session if headers not available
  const session = await auth()
  if (session?.user?.role) {
    return session.user.role
  }
  
  throw new Error("User role not found")
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const userRole = await getUserRole(request)
    
    if (!allowedRoles.includes(userRole)) {
      throw new Error("Insufficient permissions")
    }

    return userRole
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error)

  if (error instanceof ZodError) {
    console.error("Validation errors:", error.errors)
    return createErrorResponse(`Invalid input data: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`, 400)
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "Unauthorized":
        return createErrorResponse("Authentication required", 401)
      case "Insufficient permissions":
        return createErrorResponse("Insufficient permissions", 403)
      case "Organization context not found":
      case "User context not found":
      case "User role not found":
        return createErrorResponse("Invalid request context", 400)
      default:
        return createErrorResponse(error.message, 400)
    }
  }

  return createErrorResponse("Internal server error", 500)
}

export async function withAuth<T>(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<T>
): Promise<NextResponse | T> {
  try {
    const user = await getAuthenticatedUser(request)
    return await handler(request, user)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function withRoleAuth<T>(
  request: NextRequest,
  allowedRoles: string[],
  handler: (request: NextRequest, user: any, role: string) => Promise<T>
): Promise<NextResponse | T> {
  try {
    const user = await getAuthenticatedUser(request)
    const role = await requireRole(allowedRoles)(request)
    return await handler(request, user, role)
  } catch (error) {
    return handleApiError(error)
  }
}