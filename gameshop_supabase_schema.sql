-- ============================================================
-- GameShop Supabase Schema
-- รัน SQL นี้ใน Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== PRODUCTS ====================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  original_price NUMERIC(12, 2),
  category TEXT NOT NULL CHECK (category IN ('rov', 'freefire', 'efootball', 'pubg', 'genshin', 'roblox', 'other')),
  type TEXT NOT NULL CHECK (type IN ('account', 'item', 'topup', 'skin')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved', 'hidden')),
  images TEXT[] DEFAULT '{}',
  details JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== ORDERS ====================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_title TEXT NOT NULL,
  product_image TEXT,
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  buyer_name TEXT NOT NULL,
  seller_id UUID NOT NULL REFERENCES public.users(id),
  seller_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  platform_fee NUMERIC(12, 2) NOT NULL,
  seller_receives NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'disputed', 'refunded', 'cancelled')),
  escrow_release_at TIMESTAMPTZ,
  delivery_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== TRANSACTIONS ====================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'sale', 'refund', 'gacha', 'fee')),
  amount NUMERIC(12, 2) NOT NULL,
  balance_before NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== DEPOSITS ====================
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  slip_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== WITHDRAWALS ====================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  bank_account TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'gacha', 'system', 'dispute')),
  title TEXT NOT NULL,
  title_th TEXT NOT NULL,
  message TEXT NOT NULL,
  message_th TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== REVIEWS ====================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) UNIQUE,
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  buyer_name TEXT NOT NULL,
  buyer_avatar TEXT,
  seller_id UUID NOT NULL REFERENCES public.users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== DISPUTES ====================
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) UNIQUE,
  reporter_id UUID NOT NULL REFERENCES public.users(id),
  reporter_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  admin_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== GACHA POOLS ====================
CREATE TABLE IF NOT EXISTS public.gacha_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  description TEXT,
  description_th TEXT,
  category TEXT NOT NULL CHECK (category IN ('rov', 'freefire', 'efootball', 'pubg', 'genshin', 'roblox', 'other')),
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_pulls INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== GACHA ITEMS ====================
CREATE TABLE IF NOT EXISTS public.gacha_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES public.gacha_pools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  drop_rate NUMERIC(5, 2) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 100),
  image TEXT,
  value NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- ==================== GACHA PULLS ====================
CREATE TABLE IF NOT EXISTS public.gacha_pulls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES public.gacha_pools(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  item_id UUID NOT NULL REFERENCES public.gacha_items(id),
  seed TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== AUDIT LOGS ====================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_user ON public.gacha_pulls(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- ============================================================
-- FUNCTIONS & STORED PROCEDURES
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Increment product views (atomic)
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET views = views + 1 WHERE id = product_id;
END;
$$;

-- Create Order (deducts balance atomically)
CREATE OR REPLACE FUNCTION public.create_order(p_product_id UUID, p_buyer_id UUID)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product public.products;
  v_buyer public.users;
  v_platform_fee NUMERIC;
  v_seller_receives NUMERIC;
  v_order public.orders;
BEGIN
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
  IF v_product.status != 'available' THEN RAISE EXCEPTION 'Product not available'; END IF;

  SELECT * INTO v_buyer FROM public.users WHERE id = p_buyer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Buyer not found'; END IF;
  IF v_buyer.balance < v_product.price THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_platform_fee := FLOOR(v_product.price * 0.05);
  v_seller_receives := v_product.price - v_platform_fee;

  -- Deduct buyer balance
  UPDATE public.users SET balance = balance - v_product.price WHERE id = p_buyer_id;

  -- Reserve product
  UPDATE public.products SET status = 'reserved' WHERE id = p_product_id;

  -- Create order
  INSERT INTO public.orders (
    product_id, product_title, product_image,
    buyer_id, buyer_name, seller_id, seller_name,
    amount, platform_fee, seller_receives, status,
    escrow_release_at
  ) VALUES (
    v_product.id, v_product.title, v_product.images[1],
    v_buyer.id, v_buyer.display_name, v_product.seller_id, v_product.seller_name,
    v_product.price, v_platform_fee, v_seller_receives, 'paid',
    NOW() + INTERVAL '3 days'
  ) RETURNING * INTO v_order;

  -- Record buyer transaction
  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (p_buyer_id, 'purchase', -v_product.price, v_buyer.balance, v_buyer.balance - v_product.price, 'completed', 'ซื้อสินค้า: ' || v_product.title, v_order.id::text);

  -- Notify seller
  INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link)
  VALUES (
    v_product.seller_id, 'order',
    'New Order', 'คำสั่งซื้อใหม่',
    'You have a new order for ' || v_product.title,
    'มีคำสั่งซื้อใหม่: ' || v_product.title,
    '/orders'
  );

  RETURN v_order;
END;
$$;

-- Confirm Delivery (releases escrow to seller)
CREATE OR REPLACE FUNCTION public.confirm_delivery(p_order_id UUID, p_buyer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order public.orders;
  v_seller public.users;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.buyer_id != p_buyer_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF v_order.status NOT IN ('paid', 'processing') THEN RAISE EXCEPTION 'Invalid order status'; END IF;

  SELECT * INTO v_seller FROM public.users WHERE id = v_order.seller_id FOR UPDATE;

  -- Release to seller
  UPDATE public.users SET balance = balance + v_order.seller_receives WHERE id = v_order.seller_id;

  -- Update order
  UPDATE public.orders SET status = 'completed', updated_at = NOW() WHERE id = p_order_id;

  -- Mark product as sold
  UPDATE public.products SET status = 'sold' WHERE id = v_order.product_id;

  -- Record seller transaction
  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (v_order.seller_id, 'sale', v_order.seller_receives, v_seller.balance, v_seller.balance + v_order.seller_receives, 'completed', 'ได้รับเงินจากคำสั่งซื้อ: ' || v_order.product_title, p_order_id::text);

  -- Record platform fee
  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (v_order.seller_id, 'fee', -v_order.platform_fee, v_seller.balance, v_seller.balance, 'completed', 'ค่าธรรมเนียมแพลตฟอร์ม', p_order_id::text);

  -- Notify seller
  INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link)
  VALUES (
    v_order.seller_id, 'payment',
    'Payment Released', 'ปล่อยเงินแล้ว',
    'Payment of ' || v_order.seller_receives || ' THB has been released',
    'ปล่อยเงิน ' || v_order.seller_receives || ' บาทแล้ว',
    '/orders'
  );
END;
$$;

-- Admin: Force Complete Order
CREATE OR REPLACE FUNCTION public.admin_force_complete(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order public.orders;
  v_seller public.users;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT * INTO v_seller FROM public.users WHERE id = v_order.seller_id FOR UPDATE;

  UPDATE public.users SET balance = balance + v_order.seller_receives WHERE id = v_order.seller_id;
  UPDATE public.orders SET status = 'completed', updated_at = NOW() WHERE id = p_order_id;
  UPDATE public.products SET status = 'sold' WHERE id = v_order.product_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (v_order.seller_id, 'sale', v_order.seller_receives, v_seller.balance, v_seller.balance + v_order.seller_receives, 'completed', '[Admin] Force complete: ' || v_order.product_title, p_order_id::text);
END;
$$;

-- Admin: Refund Order
CREATE OR REPLACE FUNCTION public.admin_refund_order(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order public.orders;
  v_buyer public.users;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT * INTO v_buyer FROM public.users WHERE id = v_order.buyer_id FOR UPDATE;

  UPDATE public.users SET balance = balance + v_order.amount WHERE id = v_order.buyer_id;
  UPDATE public.orders SET status = 'refunded', updated_at = NOW() WHERE id = p_order_id;
  UPDATE public.products SET status = 'available' WHERE id = v_order.product_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (v_order.buyer_id, 'refund', v_order.amount, v_buyer.balance, v_buyer.balance + v_order.amount, 'completed', '[Admin] Refund: ' || v_order.product_title, p_order_id::text);

  INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link)
  VALUES (v_order.buyer_id, 'payment', 'Refund Processed', 'คืนเงินแล้ว', 'Your refund has been processed', 'คืนเงินของคุณเรียบร้อยแล้ว', '/orders');
END;
$$;

-- Approve Deposit
CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id UUID, p_admin_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deposit public.deposits;
  v_user public.users;
BEGIN
  SELECT * INTO v_deposit FROM public.deposits WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF v_deposit.status != 'pending' THEN RAISE EXCEPTION 'Deposit already processed'; END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_deposit.user_id FOR UPDATE;

  UPDATE public.users SET balance = balance + v_deposit.amount WHERE id = v_deposit.user_id;
  UPDATE public.deposits SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = NOW() WHERE id = p_deposit_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (v_deposit.user_id, 'deposit', v_deposit.amount, v_user.balance, v_user.balance + v_deposit.amount, 'completed', 'เติมเงิน', p_deposit_id::text);

  INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link)
  VALUES (v_deposit.user_id, 'payment', 'Deposit Approved', 'ยืนยันการเติมเงินแล้ว', 'Your deposit of ' || v_deposit.amount || ' THB has been approved', 'เติมเงิน ' || v_deposit.amount || ' บาทสำเร็จ', '/wallet');
END;
$$;

-- Approve Withdrawal
CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_withdrawal_id UUID, p_admin_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_withdrawal public.withdrawals;
  v_user public.users;
BEGIN
  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_withdrawal.status != 'pending' THEN RAISE EXCEPTION 'Withdrawal already processed'; END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_withdrawal.user_id FOR UPDATE;
  IF v_user.balance < v_withdrawal.amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.users SET balance = balance - v_withdrawal.amount WHERE id = v_withdrawal.user_id;
  UPDATE public.withdrawals SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = NOW() WHERE id = p_withdrawal_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (v_withdrawal.user_id, 'withdrawal', -v_withdrawal.amount, v_user.balance, v_user.balance - v_withdrawal.amount, 'completed', 'ถอนเงิน', p_withdrawal_id::text);

  INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link)
  VALUES (v_withdrawal.user_id, 'payment', 'Withdrawal Approved', 'อนุมัติการถอนเงินแล้ว', 'Withdrawal of ' || v_withdrawal.amount || ' THB approved', 'ถอนเงิน ' || v_withdrawal.amount || ' บาทสำเร็จ', '/wallet');
END;
$$;

-- Gacha Pull (atomic)
CREATE OR REPLACE FUNCTION public.do_gacha_pull(p_pool_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pool public.gacha_pools;
  v_user public.users;
  v_items public.gacha_items[];
  v_selected public.gacha_items;
  v_total_weight NUMERIC := 0;
  v_random NUMERIC;
  v_cumulative NUMERIC := 0;
  v_item public.gacha_items;
  v_pull public.gacha_pulls;
  v_seed TEXT;
BEGIN
  SELECT * INTO v_pool FROM public.gacha_pools WHERE id = p_pool_id AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gacha pool not found or inactive'; END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF v_user.balance < v_pool.price THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  SELECT ARRAY_AGG(gi.*) INTO v_items FROM public.gacha_items gi WHERE pool_id = p_pool_id;
  IF v_items IS NULL OR ARRAY_LENGTH(v_items, 1) = 0 THEN RAISE EXCEPTION 'No items in pool'; END IF;

  FOREACH v_item IN ARRAY v_items LOOP
    v_total_weight := v_total_weight + v_item.drop_rate;
  END LOOP;

  v_random := RANDOM() * v_total_weight;
  v_selected := v_items[1];

  FOREACH v_item IN ARRAY v_items LOOP
    v_cumulative := v_cumulative + v_item.drop_rate;
    IF v_random <= v_cumulative THEN
      v_selected := v_item;
      EXIT;
    END IF;
  END LOOP;

  v_seed := MD5(RANDOM()::TEXT || NOW()::TEXT);

  UPDATE public.users SET balance = balance - v_pool.price WHERE id = p_user_id;
  UPDATE public.gacha_pools SET total_pulls = total_pulls + 1 WHERE id = p_pool_id;

  INSERT INTO public.gacha_pulls (pool_id, user_id, item_id, seed)
  VALUES (p_pool_id, p_user_id, v_selected.id, v_seed)
  RETURNING * INTO v_pull;

  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (p_user_id, 'gacha', -v_pool.price, v_user.balance, v_user.balance - v_pool.price, 'completed', 'สุ่มตู้: ' || v_pool.name_th, v_pull.id::text);

  RETURN jsonb_build_object(
    'pull_id', v_pull.id,
    'item_id', v_selected.id,
    'item_name', v_selected.name,
    'item_name_th', v_selected.name_th,
    'rarity', v_selected.rarity,
    'image', v_selected.image,
    'value', v_selected.value,
    'seed', v_seed
  );
END;
$$;

-- Release Escrow (dispute resolved for seller)
CREATE OR REPLACE FUNCTION public.release_escrow(p_order_id UUID, p_dispute_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_force_complete(p_order_id);
  UPDATE public.disputes SET status = 'resolved', resolved_at = NOW() WHERE id = p_dispute_id;
END;
$$;

-- Refund Buyer (dispute resolved for buyer)
CREATE OR REPLACE FUNCTION public.refund_buyer(p_order_id UUID, p_dispute_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_refund_order(p_order_id);
  UPDATE public.disputes SET status = 'resolved', resolved_at = NOW() WHERE id = p_dispute_id;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_pulls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: read own, admin reads all
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Products: public read available, seller manages own, admin all
CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (status = 'available' OR seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "products_insert_seller" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_update_seller" ON public.products FOR UPDATE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Orders: buyer/seller/admin
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Transactions: own only
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Notifications: own only
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Deposits: own or admin
CREATE POLICY "deposits_select" ON public.deposits FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "deposits_insert" ON public.deposits FOR INSERT WITH CHECK (user_id = auth.uid());

-- Withdrawals: own or admin
CREATE POLICY "withdrawals_select" ON public.withdrawals FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "withdrawals_insert" ON public.withdrawals FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reviews: public read
CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert_buyer" ON public.reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Disputes: own/admin
CREATE POLICY "disputes_select" ON public.disputes FOR SELECT USING (reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "disputes_insert" ON public.disputes FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Gacha: public pools/items, own pulls
CREATE POLICY "gacha_pools_select" ON public.gacha_pools FOR SELECT USING (is_active = TRUE OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "gacha_items_select" ON public.gacha_items FOR SELECT USING (TRUE);
CREATE POLICY "gacha_pulls_select" ON public.gacha_pulls FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Audit logs: admin only
CREATE POLICY "audit_logs_admin" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('slips', 'slips', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product_images_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "slips_auth_only" ON storage.objects FOR SELECT USING (bucket_id = 'slips' AND (auth.uid() = (storage.foldername(name))[1]::uuid OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')));
CREATE POLICY "slips_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'slips' AND auth.role() = 'authenticated');

-- ============================================================
-- FUNCTION GRANTS (สิทธิ์เรียก RPC จาก client)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.increment_product_views TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_delivery TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_complete TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_refund_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_deposit TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION public.do_gacha_pull TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_buyer TO authenticated;

-- ============================================================
-- SEED DATA (ทดสอบ)
-- ============================================================
-- รัน seed data หลังจาก sign up แล้ว
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@youremail.com';

-- ==================== ADMIN ADJUST BALANCE ====================
-- เพิ่ม/ลดยอดเงิน user โดย admin
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET balance = GREATEST(0, balance + p_amount),
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description)
  SELECT
    p_user_id,
    CASE WHEN p_amount > 0 THEN 'deposit' ELSE 'withdrawal' END,
    p_amount,
    balance - p_amount,
    balance,
    'completed',
    CASE WHEN p_amount > 0 THEN 'Admin เพิ่มยอดเงิน' ELSE 'Admin ปรับลดยอดเงิน' END
  FROM public.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute — service_role for server-side, authenticated for admin client calls
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance TO service_role, authenticated;

-- ==================== STORAGE BUCKETS ====================
-- รัน SQL นี้เพื่อสร้าง storage buckets
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('slips', 'slips', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Storage policies (product-images: anyone can read, only auth can upload)
-- CREATE POLICY "Public product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
-- CREATE POLICY "Auth upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================
-- TRIGGER: handle_new_user  (สำคัญ!)
-- สร้าง row ใน public.users อัตโนมัติเมื่อ user สมัคร auth
-- ต้องรัน GRANT บน auth schema ก่อน (ทำใน Supabase Dashboard)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name, role, balance, kyc_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    'buyer',   -- role เริ่มต้นเป็น buyer เสมอ
    0,
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- เชื่อม trigger กับ auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant สิทธิ์ trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;

-- ============================================================
-- FUNCTION: upgrade_to_seller
-- ผู้ใช้ buyer สามารถอัปเกรดตัวเองเป็น seller
-- ============================================================
CREATE OR REPLACE FUNCTION public.upgrade_to_seller(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.users
  SET role = 'seller', updated_at = NOW()
  WHERE id = p_user_id AND role = 'buyer';
END;
$$;

GRANT EXECUTE ON FUNCTION public.upgrade_to_seller TO authenticated;

-- ============================================================
-- SEED DATA สำหรับทดสอบ
-- ⚠️ รันหลังจาก sign up ด้วย email เหล่านี้ใน Supabase Auth แล้ว
-- ============================================================

-- หลังสมัครแล้ว ให้ตั้ง role admin:
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@gameshop.test';
-- UPDATE public.users SET role = 'seller' WHERE email = 'seller@gameshop.test';

-- Gacha Pools seed (ตัวอย่าง)
-- (รันหลังสร้าง admin user แล้ว)
/*
INSERT INTO public.gacha_pools (id, name, name_th, description, description_th, category, price, image, is_active, total_pulls)
VALUES
  ('pool-rov-001',    'ROV Lucky Box',      'ROV กล่องโชคดี',        'Random ROV skins and items',       'สุ่มสกิน ROV และไอเทม',         'rov',      99,  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', true, 0),
  ('pool-ff-001',     'FreeFire Fortune',   'FreeFire ฟอร์จูน',      'Random FreeFire diamonds & skins', 'สุ่มเพชร Free Fire และสกิน',    'freefire', 79,  'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0d?w=400', true, 0),
  ('pool-genshin-001','Genshin Wish Box',   'Genshin กล่องปรารถนา',  'Random primogems & characters',    'สุ่ม primogems และตัวละคร',     'genshin',  149, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', true, 0)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================
-- INDEXES สำหรับ Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_seller_id   ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status      ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id      ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id     ON public.orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_user_id  ON public.gacha_pulls (user_id);

-- ============================================================
-- v4 ADDITIONS — Deposit enhancements + Notifications trigger
-- ============================================================

ALTER TABLE deposits ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'promptpay';
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS slip_uploaded_at TIMESTAMPTZ;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);

-- Notify user when deposit is reviewed
-- (stub — replaced by the full version below that includes title_th/message_th)
-- notify_deposit_reviewed will be defined in the v4 ADDITIONS section

-- Enhanced approve_deposit RPC
CREATE OR REPLACE FUNCTION approve_deposit(p_deposit_id UUID, p_admin_id UUID)
RETURNS VOID AS $$
DECLARE
  v_deposit deposits%ROWTYPE;
BEGIN
  SELECT * INTO v_deposit FROM deposits WHERE id = p_deposit_id FOR UPDATE;
  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit is not pending (current status: %)', v_deposit.status;
  END IF;
  UPDATE deposits SET
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE id = p_deposit_id;
  UPDATE users SET balance = balance + v_deposit.amount WHERE id = v_deposit.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supabase Storage buckets (run manually in dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('slips', 'slips', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('qr-codes', 'qr-codes', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- ==================== shop_settings table ====================
-- Stores payment config editable by admin (replaces localStorage)
CREATE TABLE IF NOT EXISTS shop_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  promptpay_number TEXT NOT NULL DEFAULT '0812345678',
  promptpay_name TEXT NOT NULL DEFAULT 'GameShop',
  promptpay_qr_url TEXT DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT 'กสิกรไทย',
  bank_account TEXT NOT NULL DEFAULT '123-4-56789-0',
  bank_account_name TEXT NOT NULL DEFAULT 'นาย GameShop',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row
INSERT INTO shop_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS: only admins can write, everyone can read
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read shop_settings" ON shop_settings FOR SELECT USING (true);
CREATE POLICY "only admin can insert shop_settings" ON shop_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "only admin can update shop_settings" ON shop_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
-- Grant table access to authenticated users
GRANT SELECT, INSERT, UPDATE ON shop_settings TO authenticated;

-- ==================== notifications enhancements ====================
-- Add title_th / message_th columns if not present
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_th TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_th TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Update deposit notification trigger to use title_th/message_th
CREATE OR REPLACE FUNCTION notify_deposit_reviewed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, title_th, message, message_th, link, is_read)
    VALUES (
      NEW.user_id,
      'payment',
      CASE WHEN NEW.status = 'approved' THEN 'Deposit Approved' ELSE 'Deposit Rejected' END,
      CASE WHEN NEW.status = 'approved' THEN '✅ เติมเงินสำเร็จ' ELSE '❌ เติมเงินไม่สำเร็จ' END,
      CASE WHEN NEW.status = 'approved'
        THEN 'Balance ฿' || NEW.amount || ' added to your wallet'
        ELSE 'Deposit ฿' || NEW.amount || ' rejected: ' || COALESCE(NEW.admin_note, 'No reason given')
      END,
      CASE WHEN NEW.status = 'approved'
        THEN 'ยอดเงิน ฿' || NEW.amount || ' ถูกเพิ่มเข้ากระเป๋าของคุณแล้ว'
        ELSE 'การเติมเงิน ฿' || NEW.amount || ' ถูกปฏิเสธ: ' || COALESCE(NEW.admin_note, 'ไม่ระบุเหตุผล')
      END,
      '/wallet',
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Notify user when withdrawal is approved/rejected
CREATE OR REPLACE FUNCTION notify_withdrawal_reviewed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, title_th, message, message_th, link, is_read)
    VALUES (
      NEW.user_id,
      'payment',
      CASE WHEN NEW.status = 'approved' THEN 'Withdrawal Approved' ELSE 'Withdrawal Rejected' END,
      CASE WHEN NEW.status = 'approved' THEN '✅ ถอนเงินสำเร็จ' ELSE '❌ ถอนเงินไม่สำเร็จ' END,
      CASE WHEN NEW.status = 'approved'
        THEN 'Withdrawal ฿' || NEW.amount || ' processed successfully'
        ELSE 'Withdrawal ฿' || NEW.amount || ' rejected: ' || COALESCE(NEW.admin_note, 'No reason given')
      END,
      CASE WHEN NEW.status = 'approved'
        THEN 'การถอนเงิน ฿' || NEW.amount || ' ดำเนินการเรียบร้อย'
        ELSE 'การถอนเงิน ฿' || NEW.amount || ' ถูกปฏิเสธ: ' || COALESCE(NEW.admin_note, 'ไม่ระบุเหตุผล')
      END,
      '/wallet',
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_withdrawal_reviewed ON withdrawals;
CREATE TRIGGER on_withdrawal_reviewed
  AFTER UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION notify_withdrawal_reviewed();

-- Notify buyer when order status changes
CREATE OR REPLACE FUNCTION notify_order_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, type, title, title_th, message, message_th, link, is_read)
    VALUES (
      NEW.buyer_id,
      'order',
      CASE NEW.status
        WHEN 'delivered' THEN 'Order Delivered'
        WHEN 'completed' THEN 'Order Completed'
        WHEN 'refunded' THEN 'Order Refunded'
        ELSE 'Order Updated'
      END,
      CASE NEW.status
        WHEN 'delivered' THEN '📦 ส่งสินค้าแล้ว'
        WHEN 'completed' THEN '✅ คำสั่งซื้อเสร็จสิ้น'
        WHEN 'refunded' THEN '💰 คืนเงินแล้ว'
        ELSE '🔄 อัปเดตคำสั่งซื้อ'
      END,
      'Order #' || LEFT(NEW.id::text, 8) || ' — ' || NEW.status,
      'คำสั่งซื้อ #' || LEFT(NEW.id::text, 8) || ' — ' || NEW.status,
      '/orders',
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_updated ON orders;
CREATE TRIGGER on_order_updated
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_updated();

-- ==================== Realtime: enable for notifications ====================
-- Run in Supabase dashboard: Realtime > Tables > enable notifications table
-- Or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================================
-- FIX: RLS Policy สำหรับ users table
-- อนุญาตให้ user insert row ตัวเองได้ (fallback กรณี trigger fail)
-- ============================================================
DROP POLICY IF EXISTS "users can insert own row" ON public.users;
CREATE POLICY "users can insert own row" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users can read own row" ON public.users;
CREATE POLICY "users can read own row" ON public.users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "users can update own row" ON public.users;
CREATE POLICY "users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Grant ให้ authenticated users เข้าถึง public.users ได้
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================
-- FIX: ตรวจสอบ trigger ทำงานได้จริง
-- Run query นี้ใน SQL Editor เพื่อทดสอบ:
-- SELECT public.handle_new_user();  -- ควร error ว่า trigger function ถูกต้อง
-- ============================================================
