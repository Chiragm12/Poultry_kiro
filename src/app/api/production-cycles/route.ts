import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required"),
  startDate: z.string().min(1, "Start date is required"),
  startWeek: z.number().min(1).max(100).default(1),
  expectedEndWeek: z.number().min(1).max(200).default(72),
  farmId: z.string().min(1, "Farm ID is required"),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')

    const whereClause: any = {
      organizationId: session.user.organizationId,
    }

    if (farmId) {
      whereClause.farmId = farmId
    }

    const cycles = await prisma.productionCycle.findMany({
      where: whereClause,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: cycles })
  } catch (error) {
    console.error("Error fetching production cycles:", error)
    return NextResponse.json(
      { error: "Failed to fetch production cycles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createCycleSchema.parse(body)

    // Check if farm exists and belongs to user's organization
    const farm = await prisma.farm.findFirst({
      where: {
        id: validatedData.farmId,
        organizationId: session.user.organizationId,
      }
    })

    if (!farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 })
    }

    // Deactivate any existing active cycles for this farm
    await prisma.productionCycle.updateMany({
      where: {
        farmId: validatedData.farmId,
        isActive: true,
      },
      data: {
        isActive: false,
      }
    })

    // Create new production cycle
    const cycle = await prisma.productionCycle.create({
      data: {
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        startWeek: validatedData.startWeek,
        expectedEndWeek: validatedData.expectedEndWeek,
        farmId: validatedData.farmId,
        organizationId: session.user.organizationId,
        isActive: true,
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

    return NextResponse.json({ success: true, data: cycle })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating production cycle:", error)
    return NextResponse.json(
      { error: "Failed to create production cycle" },
      { status: 500 }
    )
  }
}