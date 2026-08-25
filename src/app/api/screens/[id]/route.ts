import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Using service role or public policy depending on setup. 
    // We configured a public policy for SELECT on screens in our setup script.
    const { data: screen, error } = await supabase
      .from('screens')
      .select('current_poster_url')
      .eq('id', params.id)
      .single()

    if (error || !screen) {
      return NextResponse.json({ error: 'Screen not found or query failed' }, { status: 404 })
    }

    return NextResponse.json({
      poster_url: screen.current_poster_url || null
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
