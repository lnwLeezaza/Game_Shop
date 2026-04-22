'use client'

import { useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Package, ShoppingCart, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore, useOrderStore, useProductStore, useTransactionStore } from '@/lib/store'
import { useLocale, formatPrice, getRelativeTime } from '@/hooks/use-locale'

declare global { interface Window { Chart: any } }

const TEAL = '#1D9E75'
const categoryEmoji: Record<string, string> = {
  roblox:'🟥', rov:'⚔️', freefire:'🔥', pubg:'🪖', genshin:'✨', efootball:'⚽', other:'🎮',
}
const statusConfig: Record<string, { label:string; labelEn:string; color:string; text:string }> = {
  pending:    { label:'รอดำเนินการ', labelEn:'Pending',    color:'#FAEEDA', text:'#854F0B' },
  processing: { label:'กำลังดำเนิน', labelEn:'Processing', color:'#E6F1FB', text:'#185FA5' },
  paid:       { label:'ชำระแล้ว',    labelEn:'Paid',       color:'#EAF3DE', text:'#3B6D11' },
  completed:  { label:'เสร็จสิ้น',   labelEn:'Done',       color:'#F1EFE8', text:'#5F5E5A' },
  disputed:   { label:'มีข้อพิพาท',  labelEn:'Disputed',   color:'#FCEBEB', text:'#A32D2D' },
  cancelled:  { label:'ยกเลิก',      labelEn:'Cancelled',  color:'#FCEBEB', text:'#A32D2D' },
}
const peakHours = [12,8,6,10,18,35,60,80,100,90,85,75,65,55,50,42,38,30,28,40,55,70,60,42]
const donutColors = [TEAL,'#3266ad','#EF9F27','#888780']

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { orders, fetchOrders } = useOrderStore()
  const { products, fetchProducts } = useProductStore()
  const { transactions, fetchTransactions } = useTransactionStore()
  const { locale } = useLocale()
  const revenueRef = useRef<HTMLCanvasElement>(null)
  const donutRef = useRef<HTMLCanvasElement>(null)
  const revenueInst = useRef<any>(null)
  const donutInst = useRef<any>(null)

  useEffect(() => {
    if (user) { fetchOrders(user.id); fetchProducts(); fetchTransactions(user.id) }
  }, [user])

  const userOrders = useMemo(() => orders.filter(o => o.buyerId===user?.id||o.sellerId===user?.id), [orders,user])
  const userProducts = useMemo(() => products.filter(p => p.sellerId===user?.id), [products,user])
  const pendingOrders = userOrders.filter(o => o.status==='pending'||o.status==='processing')
  const totalSales = userOrders.filter(o=>o.sellerId===user?.id&&(o.status==='completed'||o.status==='paid')).reduce((s,o)=>s+o.sellerReceives,0)

  const revenueData = useMemo(() => {
    const base = Math.max(totalSales/30, 500)
    return Array.from({length:30},(_,i)=>Math.round((Math.sin(i*0.7)*0.3+Math.cos(i*0.4)*0.2+1)*base))
  }, [totalSales])

  const catBreakdown = useMemo(() => {
    const map: Record<string,number> = {}
    userOrders.filter(o=>o.sellerId===user?.id).forEach(o=>{
      const cat = products.find(p=>p.id===o.productId)?.category||'other'
      map[cat]=(map[cat]||0)+o.amount
    })
    const total=Object.values(map).reduce((s,v)=>s+v,0)||1
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,4)
      .map(([cat,val])=>({cat,val,pct:Math.round(val/total*100)}))
  }, [userOrders,products,user])

  useEffect(() => {
    const init = () => {
      if(!window.Chart||!revenueRef.current||!donutRef.current) return
      revenueInst.current?.destroy(); donutInst.current?.destroy()
      revenueInst.current = new window.Chart(revenueRef.current, {
        type:'line',
        data:{ labels:Array.from({length:30},(_,i)=>i+1),
          datasets:[{data:revenueData,borderColor:TEAL,backgroundColor:'rgba(29,158,117,0.07)',borderWidth:1.5,pointRadius:0,fill:true,tension:0.4}] },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{callbacks:{label:(c:any)=>'฿'+c.parsed.y.toLocaleString()}} },
          scales:{
            x:{grid:{display:false},ticks:{color:'#888780',font:{size:10},maxTicksLimit:6}},
            y:{grid:{color:'rgba(136,135,128,0.12)'},ticks:{color:'#888780',font:{size:10},callback:(v:number)=>'฿'+(v>=1000?(v/1000).toFixed(0)+'k':v)}}
          }
        }
      })
      const dd=catBreakdown.length>0?catBreakdown.map(c=>c.pct):[35,28,20,17]
      const dl=catBreakdown.length>0?catBreakdown.map(c=>c.cat):['Roblox','RoV','Free Fire','Others']
      donutInst.current = new window.Chart(donutRef.current, {
        type:'doughnut',
        data:{ labels:dl, datasets:[{data:dd,backgroundColor:donutColors,borderWidth:0,hoverOffset:4}] },
        options:{ responsive:false, cutout:'72%', plugins:{legend:{display:false},tooltip:{callbacks:{label:(c:any)=>c.label+' '+c.parsed+'%'}}} }
      })
    }
    if(window.Chart) { init() } else {
      const s=document.createElement('script')
      s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
      s.onload=init; document.head.appendChild(s)
    }
    return()=>{ revenueInst.current?.destroy(); donutInst.current?.destroy() }
  }, [revenueData,catBreakdown])

  if(!user) return null
  const th = locale==='th'
  const card = { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-md)', padding:'16px' }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1 style={{fontSize:'18px',fontWeight:500,color:'var(--color-text-primary)',margin:0}}>
            {th?`สวัสดี, ${user.displayName}`:`Hello, ${user.displayName}`}
          </h1>
          <p style={{fontSize:'13px',color:'var(--color-text-tertiary)',marginTop:'2px'}}>
            {th?'ภาพรวมร้านค้าของคุณ':'Your store overview'}
          </p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <Link href="/dashboard/products/new">
            <Button size="sm" style={{gap:'6px',background:TEAL,color:'white',border:'none'}}>
              <Plus style={{width:14,height:14}}/>{th?'ลงขายสินค้า':'New product'}
            </Button>
          </Link>
          <Avatar style={{width:36,height:36}}>
            <AvatarImage src={user.avatar}/>
            <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* 4 metric cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
        {[
          {label:th?'ยอดเงินในกระเป๋า':'Balance', value:formatPrice(user.balance,locale), delta:'+12%', pos:true, href:'/wallet'},
          {label:th?'รายได้รวม':'Total Revenue', value:formatPrice(totalSales,locale), delta:'+8%', pos:true, href:'/dashboard/orders'},
          {label:th?'สินค้าของฉัน':'My Products', value:String(userProducts.length), href:'/dashboard/products'},
          {label:th?'ออเดอร์รอดำเนินการ':'Pending Orders', value:String(pendingOrders.length), delta:pendingOrders.length>0?`${pendingOrders.length} รายการ`:undefined, pos:false, href:'/dashboard/orders'},
        ].map(c=>(
          <Link key={c.label} href={c.href} style={{textDecoration:'none'}}>
            <div style={{...card,cursor:'pointer'}}>
              <div style={{fontSize:'10px',color:'var(--color-text-tertiary)',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.4px',fontFamily:'monospace'}}>{c.label}</div>
              <div style={{fontSize:'22px',fontWeight:500,color:'var(--color-text-primary)',letterSpacing:'-0.5px',lineHeight:1}}>{c.value}</div>
              {c.delta&&(
                <div style={{display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'11px',marginTop:'6px',padding:'2px 8px',borderRadius:'99px',fontFamily:'monospace',background:c.pos?'#EAF3DE':'#FAEEDA',color:c.pos?'#3B6D11':'#854F0B'}}>
                  {c.pos?<ArrowUpRight style={{width:10,height:10}}/>:<ArrowDownRight style={{width:10,height:10}}/>}{c.delta}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue chart + Donut */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:'12px'}}>
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
            <span style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-primary)'}}>{th?'รายได้ 30 วัน':'Revenue (30 days)'}</span>
            <span style={{fontSize:'11px',color:'var(--color-text-tertiary)',fontFamily:'monospace'}}>daily</span>
          </div>
          <div style={{position:'relative',width:'100%',height:'160px'}}>
            <canvas ref={revenueRef} role="img" aria-label="Revenue trend 30 days"/>
          </div>
        </div>
        <div style={card}>
          <div style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-primary)',marginBottom:'14px'}}>{th?'สัดส่วนหมวดหมู่':'Top categories'}</div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'14px'}}>
            <div style={{position:'relative',width:'120px',height:'120px'}}>
              <canvas ref={donutRef} width={120} height={120} role="img" aria-label="Sales by category"/>
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}>
                <div style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-primary)',fontFamily:'monospace'}}>
                  {'฿'+(totalSales>=1000?(totalSales/1000).toFixed(0)+'k':totalSales)}
                </div>
                <div style={{fontSize:'10px',color:'var(--color-text-tertiary)'}}>total</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'7px',width:'100%'}}>
              {(catBreakdown.length>0?catBreakdown:[{cat:'roblox',pct:35},{cat:'rov',pct:28},{cat:'freefire',pct:20},{cat:'other',pct:17}]).map((item,i)=>(
                <div key={item.cat} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',color:'var(--color-text-secondary)'}}>
                    <div style={{width:'8px',height:'8px',borderRadius:'2px',background:donutColors[i]||'#888780',flexShrink:0}}/>
                    {item.cat.charAt(0).toUpperCase()+item.cat.slice(1)}
                  </div>
                  <span style={{fontSize:'11px',fontFamily:'monospace',color:'var(--color-text-tertiary)'}}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders + Store stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:'12px'}}>
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
            <span style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-primary)'}}>{th?'คำสั่งซื้อล่าสุด':'Recent orders'}</span>
            <Link href="/dashboard/orders" style={{fontSize:'11px',color:'var(--color-text-tertiary)',fontFamily:'monospace',textDecoration:'none'}}>{th?'ดูทั้งหมด →':'see all →'}</Link>
          </div>
          {userOrders.length>0 ? userOrders.slice(0,5).map(order=>{
            const st=statusConfig[order.status]||statusConfig.pending
            const p=products.find(pr=>pr.id===order.productId)
            const emoji=categoryEmoji[p?.category||'other']||'🎮'
            return(
              <div key={order.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                <div style={{width:'34px',height:'34px',borderRadius:'var(--border-radius-md)',background:'var(--color-background-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>{emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'12px',fontWeight:500,color:'var(--color-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{order.productTitle}</div>
                  <div style={{fontSize:'11px',color:'var(--color-text-tertiary)'}}>{getRelativeTime(order.createdAt,locale)}</div>
                </div>
                <div style={{fontSize:'10px',padding:'3px 8px',borderRadius:'99px',fontFamily:'monospace',background:st.color,color:st.text,flexShrink:0}}>{th?st.label:st.labelEn}</div>
                <div style={{fontSize:'13px',fontWeight:500,fontFamily:'monospace',color:'var(--color-text-primary)',flexShrink:0}}>{formatPrice(order.amount,locale)}</div>
              </div>
            )
          }) : (
            <div style={{padding:'32px',textAlign:'center',color:'var(--color-text-tertiary)',fontSize:'13px'}}>{th?'ยังไม่มีคำสั่งซื้อ':'No orders yet'}</div>
          )}
        </div>
        <div style={{...card,display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-primary)',marginBottom:'14px'}}>{th?'สถิติร้านค้า':'Store stats'}</div>
          {[
            {label:th?'สินค้าทั้งหมด':'Products',value:String(userProducts.length)},
            {label:th?'ขายแล้ว':'Items sold',value:String(userOrders.filter(o=>o.status==='completed').length)},
            {label:th?'รีวิว 5 ดาว':'Avg rating',value:'4.8/5'},
            {label:th?'รอดำเนินการ':'Pending',value:String(pendingOrders.length)},
          ].map(row=>(
            <div key={row.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
              <span style={{fontSize:'12px',color:'var(--color-text-secondary)'}}>{row.label}</span>
              <span style={{fontSize:'13px',fontWeight:500,fontFamily:'monospace',color:'var(--color-text-primary)'}}>{row.value}</span>
            </div>
          ))}
          <div style={{marginTop:'14px'}}>
            <div style={{fontSize:'10px',color:'var(--color-text-tertiary)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>{th?'ช่วงเวลายอดนิยม':'Peak hours'}</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:'2px',height:'36px'}}>
              {peakHours.map((h,i)=>(
                <div key={i} title={`${i}:00`} style={{flex:1,height:`${h}%`,background:TEAL,borderRadius:'2px 2px 0 0',opacity:h===100?1:0.5}}/>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'var(--color-text-tertiary)',fontFamily:'monospace',marginTop:'4px'}}>
              <span>00:00</span><span style={{color:TEAL}}>peak 08:00</span><span>23:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={card}>
        <div style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-primary)',marginBottom:'12px'}}>{th?'ทำอะไรต่อ?':'Quick actions'}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
          {[
            {href:'/dashboard/products/new',icon:Plus,label:th?'ลงขายสินค้า':'List Product'},
            {href:'/wallet',icon:Wallet,label:th?'เติมเงิน':'Deposit'},
            {href:'/products',icon:ShoppingCart,label:th?'ซื้อสินค้า':'Browse'},
            {href:'/gacha',icon:TrendingUp,label:th?'ตู้สุ่ม':'Gacha'},
          ].map(a=>(
            <Link key={a.href} href={a.href} style={{textDecoration:'none'}}>
              <button style={{width:'100%',padding:'12px 8px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-tertiary)',background:'var(--color-background-secondary)',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',cursor:'pointer',fontSize:'12px',color:'var(--color-text-secondary)'}}>
                <a.icon style={{width:18,height:18,color:TEAL}}/>
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
