/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env['CRON_SECRET']}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] as string
  )

  const { error } = await supabase.rpc('run_inactivity_check')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}