# 🎮 GameShop v5 — คู่มือการติดตั้งและใช้งาน

## ภาพรวมระบบ

GameShop เป็น marketplace ซื้อขายไอดีเกม พร้อมระบบสุ่มกาชา สร้างด้วย:
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Deployment:** Vercel

---

## 1. ขั้นตอนเริ่มต้น (Setup)

### 1.1 สร้าง Supabase Project
1. ไปที่ [supabase.com](https://supabase.com) → New Project
2. ตั้งชื่อ project และ password
3. เลือก region ใกล้ไทย (Singapore)

### 1.2 รัน SQL Schema
1. ใน Supabase Dashboard → **SQL Editor**
2. เปิดไฟล์ `gameshop_supabase_schema.sql` ในโปรเจกต์
3. คัดลอกทั้งหมด → วางใน SQL Editor → **Run**
4. ตรวจสอบว่าไม่มี error

### 1.3 สร้าง Storage Buckets
ใน Supabase Dashboard → **Storage** → สร้าง bucket ต่อไปนี้:

| Bucket Name | Public |
|---|---|
| `slips` | ✅ Public |
| `product-images` | ✅ Public |
| `avatars` | ✅ Public |
| `qr-codes` | ✅ Public |

### 1.4 เปิด Realtime
ใน Supabase Dashboard → **Database** → **Replication** → เปิด Realtime สำหรับ:
- ✅ `notifications`
- ✅ `users`
- ✅ `deposits`
- ✅ `orders`

### 1.5 ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.local.example` เป็น `.env.local` แล้วใส่ค่า:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

หาค่าได้จาก Supabase Dashboard → **Project Settings** → **API**

---

## 2. รันในเครื่อง (Local Development)

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

---

## 3. Deploy บน Vercel

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

ตั้งค่า Environment Variables ใน Vercel Dashboard เหมือนกับ `.env.local`

---

## 4. สร้าง Admin Account

1. ลงทะเบียนปกติผ่านหน้า `/register`
2. ไปที่ Supabase Dashboard → **Table Editor** → ตาราง `users`
3. หา user ที่เพิ่งสมัคร → แก้ไข `role` จาก `buyer` เป็น `admin`
4. Login ใหม่อีกครั้ง

---

## 5. ฟีเจอร์ Admin Panel (`/admin`)

### 5.1 Dashboard (`/admin`)
- ดูสถิติ: จำนวน users, สินค้า, orders, รายได้รวม
- ดู audit log การกระทำทั้งหมด

### 5.2 จัดการสินค้า (`/admin/products`)
- เพิ่ม/แก้ไข/ลบสินค้า
- อัปโหลดรูปภาพขึ้น Supabase Storage
- ตั้งราคา, หมวดหมู่, แท็ก

### 5.3 อนุมัติเงิน (`/admin/approvals`)
- ดู Deposits และ Withdrawals ทั้งหมดในหน้าเดียว
- Filter ตามสถานะ: pending / approved / rejected
- Approve → ระบบตัดเงิน/เพิ่มเงิน user ทันที
- Reject → ใส่เหตุผล → user ได้รับ notification

### 5.4 ตรวจสลิป (`/admin/deposits`)
- ดูรูปสลิปที่ user อัปโหลด (Zoom ได้)
- อนุมัติทีละรายการหรือ Bulk Approve
- ตั้งค่าเลข PromptPay / QR Code / บัญชีธนาคาร → บันทึกลง DB

### 5.5 จัดการ Users (`/admin/users`)
- เปลี่ยน role: buyer / seller / admin
- อัปเดต KYC status
- ปรับยอดเงินด้วยตนเอง

### 5.6 ข้อพิพาท (`/admin/disputes`)
- ดูคดีที่ buyer แจ้ง
- เริ่มสอบสวน → สถานะเปลี่ยนเป็น investigating
- ตัดสิน:
  - **Release escrow** → โอนเงินให้ seller
  - **Refund buyer** → คืนเงินให้ buyer

### 5.7 ระบบสุ่มกาชา
Admin ต้องเพิ่ม pools ใน Supabase โดยตรง:

```sql
-- เพิ่ม Gacha Pool
INSERT INTO gacha_pools (name, name_th, description, description_th, category, price, image, is_active)
VALUES (
  'ROV Legendary Pool', 'ตู้ ROV ตำนาน',
  'Random ROV accounts', 'สุ่มไอดี ROV หายาก',
  'rov', 150,
  'https://your-image-url.jpg',
  true
);

-- เพิ่ม Items ใน Pool (ต้องใช้ pool_id จาก query ด้านบน)
INSERT INTO gacha_items (pool_id, name, name_th, rarity, drop_rate, image, value)
VALUES
  ('<pool_id>', 'Common ROV Account', 'ไอดี ROV ธรรมดา', 'common', 60, 'https://...', 100),
  ('<pool_id>', 'Rare Skin Account', 'ไอดีมีสกิน', 'rare', 25, 'https://...', 300),
  ('<pool_id>', 'Epic Account', 'ไอดีระดับ Epic', 'epic', 12, 'https://...', 800),
  ('<pool_id>', 'Legendary Account', 'ไอดีระดับตำนาน', 'legendary', 3, 'https://...', 3000);
```

> ⚠️ **สำคัญ:** drop_rate ทั้งหมดในแต่ละ pool ต้องรวมกันได้ 100

---

## 6. ฟีเจอร์ User

### 6.1 กระเป๋าเงิน (`/wallet`)
- **เติมเงิน:** เลือกจำนวน → เลือกช่องทาง (PromptPay/TrueMoney/ธนาคาร) → อัปโหลดสลิป → รอ admin อนุมัติ
- **ถอนเงิน:** ใส่จำนวน + เลขบัญชี → รอ admin โอน
- ดูประวัติ transaction ทั้งหมดจากฐานข้อมูลจริง

### 6.2 ซื้อสินค้า (`/products`)
- Browse สินค้าทั้งหมด, filter ตามหมวดหมู่/ราคา
- กดซื้อ → ระบบหักเงิน + สร้าง order ใน DB
- ดูสถานะ order ที่ `/orders`
- เมื่อ seller ส่งข้อมูล (delivery info) จะได้รับ notification

### 6.3 ระบบสุ่มกาชา (`/gacha`)
- เลือก pool → กดสุ่ม → ระบบหักเงิน + บันทึกผลลง DB
- ดูประวัติการสุ่มทั้งหมดที่ `/gacha` (กดปุ่ม History)
- ผลสุ่มสามารถดูรหัส/ข้อมูลได้ในหน้าประวัติ

### 6.4 การแจ้งเตือน (`/notifications`)
- แจ้งเตือนแบบ **Realtime** — ขึ้นทันทีไม่ต้อง refresh
- แจ้งเตือนเมื่อ: อนุมัติเงิน, ปฏิเสธเงิน, สถานะ order เปลี่ยน, สุ่มกาชาสำเร็จ
- กดอ่านทีละรายการหรือ "อ่านทั้งหมด"

---

## 7. โครงสร้างฐานข้อมูล

| ตาราง | ใช้สำหรับ |
|---|---|
| `users` | ข้อมูล user, role, balance |
| `products` | สินค้าที่ขาย |
| `orders` | คำสั่งซื้อ + escrow |
| `transactions` | ประวัติ transaction ทั้งหมด |
| `deposits` | การเติมเงิน + รูปสลิป |
| `withdrawals` | การถอนเงิน |
| `notifications` | การแจ้งเตือน (Realtime) |
| `gacha_pools` | ตู้สุ่มกาชา |
| `gacha_items` | ของที่สุ่มได้ + drop rate |
| `gacha_pulls` | ประวัติการสุ่ม |
| `reviews` | รีวิวจาก buyer |
| `disputes` | ข้อพิพาท |
| `audit_logs` | log การกระทำ admin |
| `shop_settings` | ตั้งค่า PromptPay/ธนาคาร |

---

## 8. ข้อควรระวัง

- **Admin account** ต้องแก้ใน Supabase โดยตรง — ไม่สามารถสมัครเป็น admin ได้จาก UI
- **drop_rate** ของ gacha items ในแต่ละ pool ต้องรวมกัน = 100 เสมอ
- **Storage buckets** ต้องสร้างก่อน ไม่งั้น upload ไม่ได้
- **Realtime** ต้องเปิดใน Supabase Dashboard ไม่งั้น notification ไม่ขึ้น
- ตาราง `shop_settings` มีแค่แถวเดียว (id=1) — admin แก้ผ่านหน้า `/admin/deposits` ได้เลย

---

## 9. URL หน้าต่างๆ

| หน้า | URL | สิทธิ์ |
|---|---|---|
| หน้าแรก | `/` | ทุกคน |
| สินค้า | `/products` | ทุกคน |
| สุ่มกาชา | `/gacha` | ต้อง login |
| กระเป๋าเงิน | `/wallet` | ต้อง login |
| คำสั่งซื้อ | `/orders` | ต้อง login |
| การแจ้งเตือน | `/notifications` | ต้อง login |
| โปรไฟล์ | `/profile` | ต้อง login |
| Admin Dashboard | `/admin` | admin เท่านั้น |
| Admin อนุมัติเงิน | `/admin/approvals` | admin เท่านั้น |
| Admin ตรวจสลิป | `/admin/deposits` | admin เท่านั้น |
| Admin สินค้า | `/admin/products` | admin เท่านั้น |
| Admin Users | `/admin/users` | admin เท่านั้น |
| Admin ข้อพิพาท | `/admin/disputes` | admin เท่านั้น |

