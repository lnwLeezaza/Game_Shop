// lib/supabase/topup-client.ts
// Type-safe helpers สำหรับ Topup System

// ✅ ใช้ client หลักแทน — ป้องกัน multiple instances
export { supabase } from "@/lib/supabase/client"

// ============================================
// Types
// ============================================
export interface TopupProduct {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  banner_url: string | null;
  category: string;
  publisher: string | null;
  description: string | null;
}

export interface TopupPackage {
  id: string;
  product_id: string;
  api_sku: string;
  packcode: string;        // ✅ เพิ่ม — ใช้ส่งไป WonDD เช่น "R00012"
  name: string;
  diamond_amount: number | null;
  currency_label: string;
  price: number;
  original_price: number | null;
  cost_price: number | null; // ✅ เพิ่ม — ราคาทุน (netpricedealer จาก WonDD)
  bonus_amount: number;
  is_popular: boolean;
  sort_order: number;
}

export interface TopupOrder {
  id: string;
  user_id: string;
  product_id: string;
  package_id: string;
  player_id: string;
  player_server: string | null;
  status: "pending" | "processing" | "success" | "failed" | "refunded";
  amount: number;
  net_amount: number | null;   // ✅ เพิ่ม — ราคาสุทธิที่จ่าย WonDD จริง
  api_ref_id: string | null;
  error_message: string | null;
  payment_method: string;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ============================================
// Queries
// ============================================
export async function getTopupProduct(slug: string): Promise<TopupProduct | null> {
  const { supabase } = await import("@/lib/supabase/client")
  const { data } = await supabase
    .from("topup_products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export async function getTopupPackages(productId: string): Promise<TopupPackage[]> {
  const { supabase } = await import("@/lib/supabase/client")
  const { data } = await supabase
    .from("topup_packages")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getTopupOrder(orderId: string): Promise<TopupOrder | null> {
  const { supabase } = await import("@/lib/supabase/client")
  const { data } = await supabase
    .from("topup_orders")
    .select("*")
    .eq("id", orderId)
    .single();
  return data;
}

// ============================================
// Realtime: Subscribe to order status changes
// ============================================
export function subscribeToOrder(
  orderId: string,
  callback: (order: TopupOrder) => void
) {
  const { supabase } = require("@/lib/supabase/client")

  const channel = supabase
    .channel(`order:${orderId}`)
    .on(
      "postgres_changes",
      {
        event:  "UPDATE",
        schema: "public",
        table:  "topup_orders",
        filter: `id=eq.${orderId}`,
      },
      (payload: { new: TopupOrder }) => {
        callback(payload.new as TopupOrder);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Create Order via API Route
// ============================================
export async function createTopupOrder(payload: {
  package_id:     string;
  player_id:      string;
  player_server?: string;
  payment_ref?:   string;
  // ✅ เพิ่ม — ส่ง slug ไปด้วยเพื่อให้ API route รู้ว่าเป็นเกมอะไร
  product_slug:   string;
}): Promise<{ order_id: string; status: string }> {
  const { supabase } = await import("@/lib/supabase/client")

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // ✅ ใช้ slug แทน hardcode "rov"
  const res = await fetch(`/api/topup/${payload.product_slug}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      package_id:    payload.package_id,
      player_id:     payload.player_id,
      player_server: payload.player_server,
      payment_ref:   payload.payment_ref,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to create order");
  }

  return res.json();
}