import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { password, access_token, refresh_token } = await req.json()
    if (!password || !access_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Set the session from the recovery token
    await supabase.auth.setSession({ access_token, refresh_token: refresh_token || '' })

    const { error } = await supabase.auth.admin.updateUserById(
      (await supabase.auth.getUser(access_token)).data.user?.id || '',
      { password }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
