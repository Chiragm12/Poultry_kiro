import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { AnalyticsService } from "@/lib/analytics"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const weeks = parseInt(searchParams.get('weeks') || '12')

    const analytics = new AnalyticsService(session.user.organizationId)
    const weeklyProduction = await analytics.getWeeklyProductionSummary(weeks)

    return NextResponse.json({ data: weeklyProduction })
  } catch (error) {
    console.error("Error fetching weekly production:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly production data" },
      { status: 500 }
    )
  }
}