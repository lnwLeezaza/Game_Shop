# 🎮 GameShop — คู่มือติดตั้งสำหรับมือใหม่

> ไม่มีประสบการณ์ก็ทำได้! อ่านทีละขั้นตอนแล้วทำตามได้เลย 😊

---

## 📋 สิ่งที่ต้องมีก่อนเริ่ม

| สิ่งที่ต้องการ | ดาวน์โหลดได้ที่ | ฟรีไหม? |
|---|---|---|
| Node.js (v18 ขึ้นไป) | nodejs.org | ✅ ฟรี |
| บัญชี Supabase | supabase.com | ✅ ฟรี |
| VS Code (แนะนำ) | code.visualstudio.com | ✅ ฟรี |

**วิธีเช็คว่ามี Node.js แล้วหรือยัง:** เปิด Terminal แล้วพิมพ์:

    node --version

ถ้าขึ้น v18.x.x หรือสูงกว่า = พร้อมแล้ว ✅

---

## 🗂️ โครงสร้างโปรเจกต์ (รู้ไว้คร่าวๆ)

    project_fixed/
    ├── app/                  ← หน้าต่างๆ ของเว็บ
    │   ├── page.tsx          ← หน้าหลัก (Homepage)
    │   ├── products/         ← หน้าสินค้า
    │   ├── gacha/            ← หน้าตู้สุ่ม
    │   └── dashboard/        ← หน้าจัดการสำหรับผู้ขาย
    ├── components/           ← ชิ้นส่วน UI ที่ใช้ซ้ำ
    ├── lib/
    │   ├── store.ts          ← จัดการ state ทั้งหมด
    │   ├── supabase.ts       ← เชื่อมต่อฐานข้อมูล
    │   └── mock-data.ts      ← ข้อมูลทดสอบ (ใช้ตอนยังไม่มี DB)
    └── gameshop_supabase_schema.sql  ← สร้างตารางฐานข้อมูล

---

## 🚀 ขั้นตอนที่ 1 — ติดตั้งโปรเจกต์

### 1.1 แตกไฟล์ zip

แตกไฟล์ gameshop_fixed.zip ไว้ที่ไหนก็ได้ เช่น Desktop/gameshop

### 1.2 เปิด Terminal ในโฟลเดอร์โปรเจกต์

- Windows: คลิกขวาในโฟลเดอร์ → "Open in Terminal"
- Mac: คลิกขวา → "New Terminal at Folder"
- VS Code: เปิดโฟลเดอร์ใน VS Code แล้วกด Ctrl+`

### 1.3 ติดตั้ง dependencies

    npm install

⏳ รอสักครู่ อาจใช้เวลา 1-3 นาที ปกติมาก

---

## 🗄️ ขั้นตอนที่ 2 — ตั้งค่า Supabase (ฐานข้อมูล)

### 2.1 สร้างบัญชีและ Project

1. ไปที่ supabase.com → กด "Start your project" → สมัครด้วย GitHub หรืออีเมล
2. กด "New Project"
3. ตั้งชื่อ Project เช่น gameshop
4. ตั้ง Database Password (จดไว้ด้วย!)
5. เลือก Region → Southeast Asia (Singapore) (เร็วสุดสำหรับไทย)
6. กด "Create new project" → รอประมาณ 2 นาที

### 2.2 รัน SQL สร้างตาราง

⚠️ ขั้นตอนนี้สำคัญมาก ต้องทำให้ถูกต้องเพื่อแก้ปัญหา v_product error

1. ใน Supabase Dashboard → คลิก "SQL Editor" ที่แถบซ้าย
2. กด "New query"
3. เปิดไฟล์ gameshop_supabase_schema.sql ด้วย Notepad หรือ VS Code
4. กด Ctrl+A เพื่อเลือกทั้งหมด → Ctrl+C เพื่อคัดลอก
5. กลับมาที่ Supabase SQL Editor → วางด้วย Ctrl+V
6. กด "Run" (ปุ่มสีเขียว) หรือกด Ctrl+Enter

✅ ถ้าสำเร็จจะขึ้น: Success. No rows returned
❌ ถ้า error → ดูหัวข้อ "แก้ปัญหาที่พบบ่อย" ด้านล่าง

### 2.3 Reload Schema Cache (ห้ามข้ามขั้นตอนนี้!)

หลังรัน SQL แล้ว Supabase ต้อง "อ่าน" database ใหม่:

1. ไปที่ Settings (ไอคอนรูปเฟือง ด้านล่างซ้าย)
2. คลิก "API"
3. มองหาปุ่ม "Reload Schema" แล้วกด

💡 ถ้าไม่ทำขั้นตอนนี้ จะเจอ error: relation "v_product" does not exist

### 2.4 เก็บ API Keys

1. ยังอยู่ที่หน้า Settings → API
2. จดค่า 2 อย่างนี้ไว้:
   - Project URL → หน้าตา: https://abcdefgh.supabase.co
   - anon public key → ยาวมาก ขึ้นต้นด้วย eyJhbGc...

---

## ⚙️ ขั้นตอนที่ 3 — ตั้งค่าไฟล์ Environment

### 3.1 สร้างไฟล์ .env.local

ในโฟลเดอร์โปรเจกต์ สร้างไฟล์ใหม่ชื่อ .env.local (มีจุดนำหน้า!)

วางเนื้อหานี้ลงไป แล้วแทนที่ด้วยค่าจริงของคุณ:

    NEXT_PUBLIC_SUPABASE_URL=https://ใส่-project-url-ของคุณ.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=ใส่-anon-key-ของคุณ

ตัวอย่างที่กรอกแล้ว:

    NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

❗ ไม่ต้องใส่เครื่องหมายคำพูด " รอบๆ ค่า

### 3.2 บันทึกไฟล์

กด Ctrl+S เพื่อบันทึก

---

## ▶️ ขั้นตอนที่ 4 — รันเว็บ

    npm run dev

เปิดเบราว์เซอร์ไปที่ http://localhost:3000

🎉 เว็บขึ้นมาแล้ว!

---

## 👑 ตั้งค่า Admin

หลังจากสมัครสมาชิกในเว็บแล้ว ทำตามนี้เพื่อให้ตัวเองเป็น Admin:

1. ไปที่ Supabase → SQL Editor → New query
2. วางคำสั่งนี้ แล้วเปลี่ยนอีเมลเป็นของคุณ:

    UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

3. กด Run
4. กลับไปที่เว็บ → ออกจากระบบแล้วเข้าใหม่

---

## 🛠️ แก้ปัญหาที่พบบ่อย

### ❌ relation "v_product" does not exist

สาเหตุ: รัน SQL ไม่ครบ หรือยังไม่ได้ Reload Schema Cache

แก้ไข:
1. ไปที่ SQL Editor → รัน gameshop_supabase_schema.sql ใหม่ทั้งหมด
2. ไปที่ Settings → API → กด "Reload Schema"

---

### ❌ npm install ติดตั้งไม่ได้

แก้ไข: ตรวจสอบ Node.js version ก่อน:

    node --version

ต้องเป็น v18 ขึ้นไป ถ้าเก่ากว่านั้น ให้ไป nodejs.org แล้วดาวน์โหลด LTS version

---

### ❌ เว็บขึ้นมาแต่ไม่มีข้อมูล

ไม่ต้องกังวล! ถ้ายังไม่ได้ตั้งค่า Supabase เว็บจะใช้ข้อมูลทดสอบ (mock data) อัตโนมัติ
ซื้อขายได้ปกติ เพียงแต่ข้อมูลไม่ได้บันทึกลง database จริงๆ

---

### ❌ .env.local ไม่มีผล

แก้ไข: หยุด server ก่อน (กด Ctrl+C) แล้วรัน npm run dev ใหม่
Next.js จะอ่านค่า env ใหม่ทุกครั้งที่ start

---

### ❌ Storage Error (อัพโหลดรูปไม่ได้)

แก้ไข: ไปที่ Supabase → Storage → ตรวจสอบว่ามี buckets เหล่านี้:
- product-images (Public)
- avatars (Public)
- slips (Private)

ถ้าไม่มี ให้รัน SQL schema ใหม่อีกครั้ง

---

## 💬 ยังติดปัญหาอยู่?

ถ้าทำตามทุกขั้นตอนแล้วยังไม่ได้ ลองทำสิ่งเหล่านี้:

1. ปิดแล้วเปิด Terminal ใหม่ แล้วรัน npm run dev อีกครั้ง
2. ลบ folder .next แล้วรัน npm run dev ใหม่:

    rm -rf .next && npm run dev

3. รัน SQL ใหม่ทั้งหมด แล้วอย่าลืม Reload Schema ที่ Supabase

---

สร้างด้วย Next.js 14 + Supabase + Tailwind CSS
