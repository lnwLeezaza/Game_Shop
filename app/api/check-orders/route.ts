import { Readable } from 'stream'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMAIL_ACCOUNTS = JSON.parse(process.env.GMAIL_ACCOUNTS ?? '[]') as {
  user: string
  pass: string
  productId?: string
}[]

async function pushNotificationToUser(userId: string, payload: {
  title: string; titleTh: string; message: string; messageTh: string; type: string
}) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    title_th: payload.titleTh,
    message: payload.message,
    message_th: payload.messageTh,
    is_read: false,
  })
}

async function forwardEmailToCustomer(parsed: any, customerEmail: string, orderId: string, senderAccount: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderAccount,
      pass: EMAIL_ACCOUNTS.find(a => a.user === senderAccount)?.pass,
    },
  })
  await transporter.sendMail({
    from: senderAccount,
    to: customerEmail,
    subject: `[GameShop] ได้รับข้อมูลไอดีออเดอร์ #${orderId}`,
    html: parsed.html || `<pre>${parsed.text}</pre>`,
  })
}

async function checkAccount(account: { user: string; pass: string; productId?: string }) {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: account.user, pass: account.pass },
    logger: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  let processed = 0

  await client.connect()
  await client.mailboxOpen('INBOX')

  const status = await client.status('INBOX', { messages: true })
  const total = status.messages ?? 0
  const start = Math.max(1, total - 2)
  const range = `${start}:${total}`

  console.log('📬 Total messages:', total)
  console.log('📬 Range:', range)

  if (total === 0) {
    await client.logout()
    return 0
  }

  // หา order ล่าสุดของ product นี้
  const { data: order } = await supabase
    .from('orders')
    .select('*, users!buyer_id(id, email)')
    .eq('product_id', account.productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!order) {
    console.log('❌ No order found for productId:', account.productId)
    await client.logout()
    return 0
  }

  const customerEmail = order.users?.email
  const customerId = order.users?.id

  if (!customerEmail || !customerId) {
    await client.logout()
    return 0
  }

  console.log('✅ Found order:', order.id, '→ customer:', customerEmail)

  for await (const message of client.fetch(range, { source: true })) {
    if (!message.source) continue
    const parsed = await simpleParser(Readable.from(message.source))

    console.log('📧 Subject:', parsed.subject)

    await forwardEmailToCustomer(parsed, customerEmail, order.id, account.user)
    await pushNotificationToUser(customerId, {
      type: 'payment',
      title: 'Account Info Received',
      titleTh: 'ได้รับข้อมูลไอดีแล้ว ✅',
      message: `Order #${order.id} - check your email`,
      messageTh: `ออเดอร์ #${order.id} ส่งข้อมูลไอดีไปที่อีเมลคุณแล้ว`,
    })

    await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen'])
    processed++
  }

  await client.logout()
  return processed
}

export async function GET() {
  console.log('accounts:', EMAIL_ACCOUNTS)
  try {
    const results = await Promise.all(EMAIL_ACCOUNTS.map(checkAccount))
    const total = results.reduce((sum, n) => sum + n, 0)
    return Response.json({ ok: true, processed: total })
  } catch (err: any) {
    console.error('Full error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}