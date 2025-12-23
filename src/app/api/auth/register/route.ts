import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { signUpSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signUpSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create organization slug from name
    const orgSlug = validatedData.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this name already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          slug: orgSlug,
        },
      })

      // Create user as owner
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          hashedPassword,
          role: "OWNER",
          organizationId: organization.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
        },
      })

      return { user, organization }
    })

    return NextResponse.json({
      message: "User and organization created successfully",
      user: result.user,
    })
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}