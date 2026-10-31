import { NextResponse } from 'next/server'
import { getAllMonthsCalendarData, MONTH_CONFIGS } from '@/lib/activityCalendar'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const calendarData = await getAllMonthsCalendarData(true)
    return NextResponse.json({
      success: true,
      months: MONTH_CONFIGS,
      data: calendarData,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching calendar data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}
