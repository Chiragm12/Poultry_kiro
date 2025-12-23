import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validations"
import { hashPassword } from "@/lib/password"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Only OWNER can view all users
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get("role")

    const whereClause: any = {
      organizationId,
    }

    if (roleFilter) {
      const roles = roleFilter.split(",") as UserRole[]
      whereClause.role = { in: roles }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return createSuccessResponse(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    
    // Only OWNER can create users
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return createErrorResponse("User with this email already exists", 400)
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        role: validatedData.role,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse(user, "User created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}