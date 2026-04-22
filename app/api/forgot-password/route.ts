import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetLink,
    })

    // Always return 200 to not reveal if email exists
    if (!error) {
      try {
        await sendPasswordResetEmail(email, resetLink)
      } catch {
        // Silently fail email send — Supabase already sent one
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // Don't reveal errors
  }
}
