import { NextRequest, NextResponse } from "next/server"
import { SchedulerService } from "@/lib/scheduler"

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Processing scheduled reports...')
    await SchedulerService.processDueReports()
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled reports processed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    
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