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
        role: true,
        isActive: true,
        sex: true,
        phoneNumber: true,
        address: true,
        aadharNumber: true,
        referral: true,
        alternateContact: true,
        notes: true,
        supervisorId: true,
        jobRoleId: true,
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
        jobRole: {
          select: {
            id: true,
            title: true,
            salary: true,
            salaryType: true,
          },
        },
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

    const { 
      name, 
      role, 
      password, 
      sex, 
      phoneNumber, 
      address, 
      aadharNumber, 
      referral, 
      alternateContact, 
      supervisorId, 
      jobRoleId, 
      notes 
    } = body

    if (!name || !password) {
      return createErrorResponse("Name and password are required", 400)
    }

    if (password.length < 6) {
      return createErrorResponse("Password must be at least 6 characters long", 400)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        hashedPassword,
        role: role || "WORKER",
        sex,
        phoneNumber,
        address,
        aadharNumber,
        referral,
        alternateContact,
        supervisorId,
        jobRoleId,
        notes,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        sex: true,
        phoneNumber: true,
        address: true,
        aadharNumber: true,
        referral: true,
        alternateContact: true,
        notes: true,
        supervisorId: true,
        jobRoleId: true,
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
        jobRole: {
          select: {
            id: true,
            title: true,
            salary: true,
            salaryType: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse(user, "User created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}