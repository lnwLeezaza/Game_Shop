# GameShop v5 — Setup Guide

## ขั้นตอนติดตั้ง

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
```bash
cp .env.local.example .env.local
```
แล้วเปิดไฟล์ `.env.local` และใส่ค่าจริงจาก **Supabase Dashboard → Settings → API**

### 3. ตั้งค่า Supabase Database
รัน SQL ใน **Supabase Dashboard → SQL Editor** ตามลำดับ:

1. `gameshop_supabase_schema.sql` — schema หลัก (tables, RLS, functions, triggers)
2. `gameshop_fixes_patch.sql` — fixes ทั้งหมด (รันทับได้เลย ใช้ IF NOT EXISTS / CREATE OR REPLACE)

### 4. ตั้งค่า Supabase Auth
- ไปที่ **Authentication → Settings**
- **Site URL**: ใส่ URL ของแอป (เช่น `http://localhost:3000`)
- **Redirect URLs**: เพิ่ม `http://localhost:3000/**`

### 5. รัน Development Server
```bash
npm run dev
```
เปิด http://localhost:3000

---

## สิ่งที่ถูกแก้ไข (v5 fixes)

| # | ปัญหา | ไฟล์ |
|---|-------|------|
| 1 | `signIn` AuthApiError — Supabase URL เป็น placeholder | `.env.local.example` |
| 2 | `getProductReviews` query ล้มเหลว — ไม่มี `product_id` column ใน reviews table | `lib/supabase.ts` |
| 3 | `notify_deposit_reviewed` trigger — INSERT ใส่ column `metadata` ที่ไม่มี | `gameshop_supabase_schema.sql` |
| 4 | `admin_adjust_balance` — GRANT แค่ `service_role`, client เรียกไม่ได้ | `gameshop_fixes_patch.sql` |
| 5 | `deposits` — ขาด column `payment_method`, `slip_uploaded_at` | `gameshop_fixes_patch.sql` |
| 6 | `shop_settings` — RLS policy ไม่ครอบ INSERT | `gameshop_fixes_patch.sql` |
| 7 | `notifications` — ขาด column `title_th`, `message_th`, `link` | `gameshop_fixes_patch.sql` |
| 8 | RLS `users` table — policy ซ้ำและขัดแย้งกัน | `gameshop_fixes_patch.sql` |

---

## Demo Accounts
หลังรัน schema แล้ว สมัครด้วย email เหล่านี้ใน Supabase Auth แล้วตั้ง role:
```sql
UPDATE public.users SET role = 'admin'  WHERE email = 'admin@example.com';
UPDATE public.users SET role = 'seller' WHERE email = 'seller@example.com';
-- buyer@example.com จะเป็น buyer โดย default
```
