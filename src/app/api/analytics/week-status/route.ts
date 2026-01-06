import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { AnalyticsService } from "@/lib/analytics"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const analytics = new AnalyticsService(session.user.organizationId)
    const weekStatus = await analytics.getCurrentWeekStatus()

    return NextResponse.json({ data: weekStatus })
  } catch (error) {
    console.error("Error fetching week status:", error)
    return NextResponse.json(
      { error: "Failed to fetch week status" },
      { status: 500 }
    )
  }
}