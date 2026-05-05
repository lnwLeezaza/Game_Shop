// app/api/admin/sync-packages/route.ts
// เรียก manual: POST /api/admin/sync-packages
// Header: x-admin-secret: ค่าจาก .env ADMIN_SECRET
//
// หรือตั้ง Vercel Cron ใน vercel.json:
// { "crons": [{ "path": "/api/admin/sync-packages", "schedule": "0 3 * * *" }] }

import { createClient } from "@supabase/supabase-js";
import { fetchAllPacks, detectGame, CURRENCY_LABEL } from "@/lib/wondd/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // ป้องกันด้วย secret (ข้าม check นี้ถ้าเรียกจาก Vercel Cron)
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const adminSecret  = req.headers.get("x-admin-secret");

  if (!isVercelCron && adminSecret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allPacks = await fetchAllPacks();

    // ดึง product list จาก Supabase
    const { data: products } = await supabaseAdmin
      .from("topup_products")
      .select("id, slug");

    const slugToId = Object.fromEntries((products ?? []).map((p) => [p.slug, p.id]));

    // group ตาม game
    const grouped: Record<string, typeof allPacks> = {};
    for (const pack of allPacks) {
      const game = detectGame(pack as typeof pack & { servicecode?: string; game?: string });
      if (!grouped[game]) grouped[game] = [];
      grouped[game].push(pack);
    }

    const synced: Record<string, number> = {};
    const errors: string[] = [];

    for (const [game, packs] of Object.entries(grouped)) {
      if (game === "unknown") {
        errors.push(`Unknown prefix: ${packs.map((p) => p.packcode).slice(0, 5).join(", ")}`);
        continue;
      }

      const productId = slugToId[game];
      if (!productId) {
        errors.push(`No product for: ${game}`);
        continue;
      }

      const rows = packs.map((p) => ({
        product_id:     productId,
        packcode:       p.packcode,
        name:           p.name,
        diamond_amount: p.point,
        price:          parseFloat(p.amount),
        cost_price:     parseFloat(p.netpricedealer),
        currency_label: CURRENCY_LABEL[game] ?? "เครดิต",
        is_popular:     false,
        bonus_amount:   0,
      }));

      const { error } = await supabaseAdmin
        .from("topup_packages")
        .upsert(rows, { onConflict: "product_id,packcode" });

      if (error) errors.push(`${game}: ${error.message}`);
      else       synced[game] = rows.length;
    }

    return Response.json({ ok: true, synced, errors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
