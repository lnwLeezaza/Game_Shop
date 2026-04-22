'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, CheckCircle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore, useOrderStore } from '@/lib/store'
import { formatPrice } from '@/hooks/use-locale'
import { toast } from 'sonner'
import type { Dispute } from '@/lib/types'

export default function AdminDisputesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { updateOrderStatus } = useOrderStore()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [note, setNote] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [action, setAction] = useState<'release' | 'refund' | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    fetchDisputes()
  }, [user])

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const { disputeAPI } = await import('@/lib/supabase')
      const data = await disputeAPI.getAllDisputes()
      setDisputes(data)
    } catch {
      toast.error('โหลดข้อมูลข้อพิพาทไม่ได้')
      setDisputes([])
    } finally { setLoading(false) }
  }

  const openAction = (d: Dispute, act: 'release' | 'refund') => { setSelected(d); setAction(act); setNote(''); setShowDialog(true) }

  const handleResolve = async () => {
    if (!selected) return
    try {
      const { disputeAPI } = await import('@/lib/supabase')
      if (action === 'refund') {
        await disputeAPI.refundBuyer(selected.id, selected.orderId)
      } else {
        await disputeAPI.releaseEscrow(selected.id, selected.orderId)
      }
      await disputeAPI.updateDispute(selected.id, {
        status: 'resolved', adminNotes: note, resolvedAt: new Date().toISOString(),
      })
      await updateOrderStatus(selected.orderId, action === 'refund' ? 'refunded' : 'completed')
      setDisputes(prev => prev.map(d => d.id === selected.id ? { ...d, status: 'resolved', adminNotes: note, resolvedAt: new Date().toISOString() } : d))
      toast.success(action === 'refund' ? 'คืนเงินให้ผู้ซื้อแล้ว' : 'ปล่อยเงินให้ผู้ขายแล้ว')
    } catch { toast.error('ดำเนินการไม่สำเร็จ') }
    setShowDialog(false)
  }

  const startInvestigate = async (id: string) => {
    try {
      const { disputeAPI } = await import('@/lib/supabase')
      await disputeAPI.updateDispute(id, { status: 'investigating' })
      setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'investigating' } : d))
      toast.info('เริ่มสอบสวนแล้ว')
    } catch { toast.error('อัปเดตไม่สำเร็จ') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">จัดการข้อพิพาท</h1>
        <button onClick={fetchDisputes} className="text-sm text-muted-foreground hover:text-foreground">🔄 รีเฟรช</button>
      </div>
      {loading && <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>}
      {!loading && disputes.length === 0 && <div className="text-center py-12 text-muted-foreground">ไม่มีข้อพิพาท</div>}
      <div className="space-y-3">
        {disputes.map(d => (
          <div key={d.id} className="p-4 border rounded-xl bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{d.reporterName}</p>
                <p className="text-sm text-muted-foreground">Order: {d.orderId}</p>
                <p className="text-sm mt-1">{d.reason}</p>
              </div>
              <Badge variant={d.status === 'open' ? 'destructive' : d.status === 'investigating' ? 'secondary' : 'default'}>
                {d.status === 'open' ? 'เปิด' : d.status === 'investigating' ? 'สอบสวน' : 'แก้ไขแล้ว'}
              </Badge>
            </div>
            {d.status !== 'resolved' && (
              <div className="flex gap-2 flex-wrap">
                {d.status === 'open' && <Button size="sm" variant="outline" onClick={() => startInvestigate(d.id)}><Swords className="w-4 h-4 mr-1" />สอบสวน</Button>}
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openAction(d, 'release')}><CheckCircle className="w-4 h-4 mr-1" />ปล่อยเงินผู้ขาย</Button>
                <Button size="sm" variant="destructive" onClick={() => openAction(d, 'refund')}><DollarSign className="w-4 h-4 mr-1" />คืนเงินผู้ซื้อ</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action === 'refund' ? 'คืนเงินให้ผู้ซื้อ' : 'ปล่อยเงินให้ผู้ขาย'}</DialogTitle></DialogHeader>
          <Textarea placeholder="บันทึกของแอดมิน (ไม่บังคับ)..." value={note} onChange={e => setNote(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
            <Button className={`flex-1 ${action === 'refund' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`} onClick={handleResolve}>ยืนยัน</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
