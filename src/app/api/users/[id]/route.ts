import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { createSuccessResponse, createErrorResponse, handleApiError, getOrganizationId, getUserRole } from "@/lib/api-utils"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    const { id } = await params
    
    // Only OWNER can update users
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
      notes,
      isActive 
    } = body

    // Verify user exists and belongs to organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Prepare update data
    const updateData: any = {
      name,
      role,
      sex,
      phoneNumber,
      address,
      aadharNumber,
      referral,
      alternateContact,
      supervisorId: supervisorId || null,
      jobRoleId: jobRoleId || null,
      notes,
      isActive,
    }

    // Only update password if provided
    if (password && password.length >= 6) {
      updateData.hashedPassword = await hashPassword(password)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return createSuccessResponse(updatedUser, "User updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const organizationId = await getOrganizationId(request)
    const userRole = await getUserRole(request)
    const { id } = await params
    
    // Only OWNER can delete users
    if (userRole !== "OWNER") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Verify user exists and belongs to organization
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    await prisma.user.delete({
      where: { id },
    })

    return createSuccessResponse(null, "User deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}