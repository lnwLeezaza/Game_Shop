-- ============================================================
-- GameShop — FIXES PATCH
-- รัน SQL นี้ใน Supabase SQL Editor หลังจากรัน schema หลักแล้ว
-- (ถ้ายังไม่ได้รัน schema หลัก ให้รัน gameshop_supabase_schema.sql ก่อน)
-- ============================================================

-- ============================================================
-- FIX 1: deposits — เพิ่ม columns ที่ wallet page ใช้งาน
-- (ถ้า schema หลักยังไม่มี)
-- ============================================================
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'promptpay';
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS slip_uploaded_at TIMESTAMPTZ;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ============================================================
-- FIX 2: notifications — เพิ่ม columns ที่ขาดหาย
-- ============================================================
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title_th TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_th TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- ============================================================
-- FIX 3: shop_settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shop_settings (
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

INSERT INTO public.shop_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read shop_settings" ON public.shop_settings;
DROP POLICY IF EXISTS "only admin can update shop_settings" ON public.shop_settings;
DROP POLICY IF EXISTS "only admin can insert shop_settings" ON public.shop_settings;

CREATE POLICY "anyone can read shop_settings"
  ON public.shop_settings FOR SELECT USING (true);

CREATE POLICY "only admin can insert shop_settings"
  ON public.shop_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "only admin can update shop_settings"
  ON public.shop_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.shop_settings TO authenticated;

-- ============================================================
-- FIX 4: admin_adjust_balance — ให้ authenticated เรียกได้
-- (ก่อนหน้านี้ grant แค่ service_role ทำให้ admin client เรียกไม่ได้)
-- ============================================================
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

-- FIX: เพิ่ม authenticated ด้วย (เดิมมีแค่ service_role)
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance TO service_role, authenticated;

-- ============================================================
-- FIX 5: notify_deposit_reviewed — ลบ column metadata ที่ไม่มี
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_deposit_reviewed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link, is_read)
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

DROP TRIGGER IF EXISTS on_deposit_reviewed ON public.deposits;
CREATE TRIGGER on_deposit_reviewed
  AFTER UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.notify_deposit_reviewed();

-- ============================================================
-- FIX 6: approve_deposit — ใช้ schema หลักที่ถูกต้อง
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id UUID, p_admin_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deposit public.deposits;
  v_user public.users;
BEGIN
  SELECT * INTO v_deposit FROM public.deposits WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit already processed (status: %)', v_deposit.status;
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_deposit.user_id FOR UPDATE;

  UPDATE public.users SET balance = balance + v_deposit.amount WHERE id = v_deposit.user_id;
  UPDATE public.deposits SET
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE id = p_deposit_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, description, reference_id)
  VALUES (v_deposit.user_id, 'deposit', v_deposit.amount, v_user.balance, v_user.balance + v_deposit.amount, 'completed', 'เติมเงิน', p_deposit_id::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_deposit TO authenticated;

-- ============================================================
-- FIX 7: notify_withdrawal_reviewed trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_withdrawal_reviewed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link, is_read)
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

DROP TRIGGER IF EXISTS on_withdrawal_reviewed ON public.withdrawals;
CREATE TRIGGER on_withdrawal_reviewed
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.notify_withdrawal_reviewed();

-- ============================================================
-- FIX 8: notify_order_updated trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_order_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, title_th, message, message_th, link, is_read)
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

DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_updated();

-- ============================================================
-- FIX 9: Realtime สำหรับ notifications และ users
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ============================================================
-- FIX 10: RLS users table — ให้ insert/select/update ได้ถูกต้อง
-- ============================================================
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users can insert own row" ON public.users;
DROP POLICY IF EXISTS "users can read own row" ON public.users;
DROP POLICY IF EXISTS "users can update own row" ON public.users;

CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- ============================================================
-- FIX 11: upgrade_to_seller function
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
-- FIX 12: handle_new_user trigger (สำคัญมาก)
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
    'buyer',
    0,
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;

-- ============================================================
-- DONE ✅
-- ============================================================
