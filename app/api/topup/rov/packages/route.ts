// app/api/topup/rov/packages/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ROV_PRODUCT_ID = '4c808390-9a13-4f51-b66d-2eee1d17e389'

export async function GET() {
  const { data, error } = await supabase
    .from('topup_packages')
    .select('id, api_sku, name, diamond_amount, currency_label, price, original_price, bonus_amount, is_popular, badge, badge_color, sort_order')
    .eq('product_id', ROV_PRODUCT_ID)
    .eq('is_active', true)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const packages = data.map(p => ({
    id:            p.id,
    sku:           p.api_sku,
    amount:        p.diamond_amount,
    label:         p.name,
    currencyLabel: p.currency_label,
    price:         Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    bonusAmount:   p.bonus_amount ?? 0,
    tier:          p.diamond_amount >= 1860 ? 'big' : 'normal',
    badge:         p.is_popular ? 'ยอดนิยม' : (p.badge ?? null),
    badgeColor:    p.is_popular ? '#f59e0b'  : (p.badge_color ?? null),
    valuePerUnit:  Math.round((Number(p.price) / p.diamond_amount) * 100) / 100,
  }))

  return NextResponse.json({ packages })
}