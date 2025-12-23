import { NextRequest, NextResponse } from "next/server"
import { SchedulerService } from "@/lib/scheduler"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Processing alert notifications...')
    
    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    })
    
    let processedCount = 0
    
    for (const org of organizations) {
      try {
        await SchedulerService.sendAlertNotifications(org.id)
        processedCount++
      } catch (error) {
        console.error(`Failed to process alerts for organization ${org.id}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Alert notifications processed for ${processedCount} organizations`,
      timestamp: new Date().toISOString(),
      processedOrganizations: processedCount,
      totalOrganizations: organizations.length
    })
  } catch (error) {
    console.error('Alert cron job failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}