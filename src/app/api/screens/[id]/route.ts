import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: requests, error } = await supabase
      .from('poster_requests')
      .select('image_url, scheduled_time, duration_days')
      .eq('screen_id', params.id)
      .eq('status', 'approved')
      .lte('scheduled_time', new Date().toISOString())

    if (error) {
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    const now = new Date()
    const activeRequest = requests?.find(req => {
       if (!req.scheduled_time || !req.duration_days) return false
       const start = new Date(req.scheduled_time)
       const end = new Date(start.getTime() + req.duration_days * 24 * 60 * 60 * 1000)
       return now >= start && now <= end
    })

    return NextResponse.json({
      poster_url: activeRequest ? activeRequest.image_url : null
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
