// lib/supabase/topup-client.ts
// Type-safe helpers สำหรับ Topup System

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  name: string;
  diamond_amount: number | null;
  currency_label: string;
  price: number;
  original_price: number | null;
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
  const { data } = await supabase
    .from("topup_products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export async function getTopupPackages(productId: string): Promise<TopupPackage[]> {
  const { data } = await supabase
    .from("topup_packages")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getTopupOrder(orderId: string): Promise<TopupOrder | null> {
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
      (payload) => {
        callback(payload.new as TopupOrder);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Create Order via Edge Function
// ============================================
export async function createTopupOrder(payload: {
  package_id: string;
  player_id: string;
  player_server?: string;
  payment_ref?: string;
}): Promise<{ order_id: string; status: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/topup-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? "Failed to create order");
  }

  return res.json();
}
