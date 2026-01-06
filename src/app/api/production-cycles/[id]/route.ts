import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required").optional(),
  startDate: z.string().optional(),
  startWeek: z.number().min(1).max(100).optional(),
  expectedEndWeek: z.number().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cycle = await prisma.productionCycle.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      }
    })

    if (!cycle) {
      return NextResponse.json({ error: "Production cycle not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: cycle })
  } catch (error) {
    console.error("Error fetching production cycle:", error)
    return NextResponse.json(
      { error: "Failed to fetch production cycle" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateCycleSchema.parse(body)

    // Check if cycle exists and belongs to user's organization
    const existingCycle = await prisma.productionCycle.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      }
    })

    if (!existingCycle) {
      return NextResponse.json({ error: "Production cycle not found" }, { status: 404 })
    }

    // If activating this cycle, deactivate others for the same farm
    if (validatedData.isActive === true) {
      await prisma.productionCycle.updateMany({
        where: {
          farmId: existingCycle.farmId,
          isActive: true,
          id: { not: params.id },
        },
        data: {
          isActive: false,
        }
      })
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.startWeek !== undefined) updateData.startWeek = validatedData.startWeek
    if (validatedData.expectedEndWeek !== undefined) updateData.expectedEndWeek = validatedData.expectedEndWeek
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const cycle = await prisma.productionCycle.update({
      where: { id: params.id },
      data: updateData,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: cycle })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating production cycle:", error)
    return NextResponse.json(
      { error: "Failed to update production cycle" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Check if cycle exists and belongs to user's organization
    const existingCycle = await prisma.productionCycle.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      }
    })

    if (!existingCycle) {
      return NextResponse.json({ error: "Production cycle not found" }, { status: 404 })
    }

    await prisma.productionCycle.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: "Production cycle deleted successfully" })
  } catch (error) {
    console.error("Error deleting production cycle:", error)
    return NextResponse.json(
      { error: "Failed to delete production cycle" },
      { status: 500 }
    )
  }
}