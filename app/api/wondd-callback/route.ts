// app/api/wondd-callback/route.ts
// ⚠️  แจ้ง @wondd LineID ให้ตั้ง Callback URL เป็น:
//     https://yourdomain.com/api/wondd-callback

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.formData();

  const wonddOrderId = body.get("orderid") as string; // เช่น TS58000000001
  const wonddStatus  = body.get("status")  as string; // process | complete | fail
  const remark       = body.get("remark")  as string ?? "";

  if (!wonddOrderId) {
    return new Response("missing orderid", { status: 400 });
  }

  const statusMap: Record<string, string> = {
    complete: "success",
    fail:     "failed",
    process:  "processing",
  };

  const { error } = await supabaseAdmin
    .from("topup_orders")
    .update({
      status:        statusMap[wonddStatus] ?? "processing",
      error_message: wonddStatus === "fail" ? (remark || "เติมเกมไม่สำเร็จ") : null,
    })
    .eq("api_ref_id", wonddOrderId);

  if (error) {
    console.error("[WonDD Callback] update failed:", error);
    return new Response("error", { status: 500 });
  }

  // Supabase Realtime จะ push ไปหา subscribeToOrder() อัตโนมัติ ✅
  console.log(`[WonDD Callback] ${wonddOrderId} → ${wonddStatus}`);
  return new Response("OK", { status: 200 });
}