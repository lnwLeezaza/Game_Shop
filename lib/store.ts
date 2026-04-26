import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Product, Order, Transaction, Notification, GachaPull } from './types'
import type { Locale } from './i18n'
import { productAPI, authAPI, userAPI, orderAPI, transactionAPI, notificationAPI, gachaAPI, storageAPI } from './supabase'

// ==================== Auth Store ====================
interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, username: string, password: string, role?: string) => Promise<boolean | 'confirm_email'>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  updateBalance: (amount: number) => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          await authAPI.signIn(email, password)
          const { supabase } = await import('./supabase')
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            let profile = null
            for (let i = 0; i < 4; i++) {
              try { profile = await userAPI.getProfile(authUser.id); break }
              catch { await new Promise(r => setTimeout(r, 400)) }
            }
            if (profile) {
              set({ user: profile, isLoading: false })
              return true
            }
          }
          set({ isLoading: false })
          return false
        } catch (err: any) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (email, username, password) => {
        set({ isLoading: true })
        try {
          const authData = await authAPI.signUp(email, password, username)
          const { supabase } = await import('./supabase')

          // Case 1: Supabase เปิด Email Confirmation — session ยังไม่มี
          if (authData.user && !authData.session) {
            set({ isLoading: false })
            return 'confirm_email'
          }

          // Case 2: ได้ session ทันที
          if (authData.session && authData.user) {
            const userId = authData.user.id

            // Retry รอ trigger handle_new_user สร้าง row (รอสูงสุด 4 วินาที)
            let profile = null
            for (let attempt = 0; attempt < 8; attempt++) {
              await new Promise(r => setTimeout(r, 500))
              try { profile = await userAPI.getProfile(userId); break }
              catch { /* รอต่อ */ }
            }

            // Trigger ไม่ทำงาน → สร้าง row เอง
            if (!profile) {
              await supabase.from('users').upsert({
                id: userId, email, username,
                display_name: username, role: 'buyer', balance: 0, kyc_status: 'pending',
              }, { onConflict: 'id' })
              try { profile = await userAPI.getProfile(userId) } catch {}
            }

            if (profile) {
              set({ user: profile, isLoading: false })
              return true
            }

            // สมัครสำเร็จแต่ดึง profile ไม่ได้ → redirect login
            set({ isLoading: false })
            return 'confirm_email'
          }

          set({ isLoading: false })
          return false
        } catch (err: any) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try { await authAPI.signOut() } catch {}
        set({ user: null })
      },

      updateUser: (updates) => {
        const { user } = get()
        if (user) set({ user: { ...user, ...updates, updatedAt: new Date().toISOString() } })
      },

      updateBalance: (amount) => {
        const { user } = get()
        if (user) set({ user: { ...user, balance: user.balance + amount } })
      },

      refreshUser: async () => {
        const { user } = get()
        if (!user) return
        try {
          const profile = await userAPI.getProfile(user.id)
          set({ user: profile })
        } catch {}
      },
    }),
    { name: 'auth-storage' }
  )
)

// ==================== Locale Store ====================
interface LocaleState { locale: Locale; setLocale: (locale: Locale) => void }
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({ locale: 'th', setLocale: (locale) => set({ locale }) }),
    { name: 'locale-storage' }
  )
)

// ==================== Product Store ====================
interface ProductState {
  products: Product[]
  isLoading: boolean
  fetchProducts: () => Promise<void>
  fetchAllProducts: () => Promise<void>
  getProduct: (id: string) => Product | undefined
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views'>, imageFiles?: File[]) => Promise<Product>
  updateProduct: (id: string, updates: Partial<Product>, newImageFiles?: File[]) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  isLoading: false,
  fetchProducts: async () => {
    set({ isLoading: true })
    try {
      const result = await productAPI.getProducts(undefined, 1, 200)
      set({ products: result.data, isLoading: false })
    } catch { set({ isLoading: false }) }
  },
  fetchAllProducts: async () => {
    set({ isLoading: true })
    try {
      const all = await productAPI.getAllProducts()
      set({ products: all, isLoading: false })
    } catch { set({ isLoading: false }) }
  },
  getProduct: (id) => get().products.find(p => p.id === id),
  createProduct: async (product, imageFiles) => {
    let images = product.images || []
    if (imageFiles?.length) {
      try {
        const uploaded = await Promise.all(imageFiles.map(f => storageAPI.uploadProductImage(product.sellerId, f)))
        images = [...uploaded, ...images]
      } catch {}
    }
    const newProduct = await productAPI.createProduct({ ...product, images })
    set(state => ({ products: [newProduct, ...state.products] }))
    return newProduct
  },
  updateProduct: async (id, updates, newImageFiles) => {
    if (newImageFiles?.length) {
      const user = useAuthStore.getState().user
      try {
        const uploaded = await Promise.all(newImageFiles.map(f => storageAPI.uploadProductImage(user?.id || 'admin', f)))
        updates = { ...updates, images: [...(updates.images || []), ...uploaded] }
      } catch {}
    }
    try { await productAPI.updateProduct(id, updates) } catch {}
    set(state => ({ products: state.products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p) }))
  },
  deleteProduct: async (id) => {
    try { await productAPI.deleteProduct(id) } catch {}
    set(state => ({ products: state.products.filter(p => p.id !== id) }))
  },
}))

// ==================== Order Store ====================
interface OrderState {
  orders: Order[]
  isLoading: boolean
  fetchOrders: (userId?: string) => Promise<void>
  fetchAllOrders: () => Promise<void>
  createOrder: (productId: string, buyerId: string) => Promise<Order | null>
  updateOrderStatus: (orderId: string, status: Order['status'], deliveryInfo?: string) => Promise<void>
}

export const useOrderStore = create<OrderState>()((set) => ({
  orders: [],
  isLoading: false,
  fetchOrders: async (userId) => {
    set({ isLoading: true })
    try {
      const orders = userId ? await orderAPI.getUserOrders(userId) : await orderAPI.getAllOrders()
      set({ orders, isLoading: false })
    } catch { set({ orders: [], isLoading: false }) }
  },
  fetchAllOrders: async () => {
    set({ isLoading: true })
    try {
      const orders = await orderAPI.getAllOrders()
      set({ orders, isLoading: false })
    } catch { set({ orders: [], isLoading: false }) }
  },
  createOrder: async (productId, buyerId) => {
    const product = useProductStore.getState().getProduct(productId)
    const buyer = useAuthStore.getState().user
    if (!product || !buyer || buyer.balance < product.price) return null
    try {
      const order = await orderAPI.createOrder(productId, buyerId)
      await useAuthStore.getState().refreshUser()
      useProductStore.getState().updateProduct(productId, { status: 'reserved' })
      set(state => ({ orders: [order, ...state.orders] }))

      // Assign stock อัตโนมัติ
      try {
        const { supabase } = await import('./supabase')
        const { data: stockResult } = await supabase.rpc('assign_stock_to_order', { p_order_id: order.id })
        if (stockResult?.success) {
          // ส่ง delivery info ให้ order
          const deliveryInfo = `Account ID: ${stockResult.account_id}\nPassword: ${stockResult.account_password}${stockResult.note ? '\nNote: ' + stockResult.note : ''}`
          await orderAPI.updateOrderStatus(order.id, order.status, deliveryInfo)
        }
      } catch {}

      return order
    } catch { return null }
  },
  updateOrderStatus: async (orderId, status, deliveryInfo) => {
    try { await orderAPI.updateOrderStatus(orderId, status, deliveryInfo) } catch {}
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, status, deliveryInfo: deliveryInfo || o.deliveryInfo, updatedAt: new Date().toISOString() } : o)
    }))
  },
}))

// ==================== Transaction Store ====================
interface TransactionState {
  transactions: Transaction[]
  isLoading: boolean
  fetchTransactions: (userId: string) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
}
export const useTransactionStore = create<TransactionState>()((set) => ({
  transactions: [],
  isLoading: false,
  fetchTransactions: async (userId) => {
    set({ isLoading: true })
    try {
      const txns = await transactionAPI.getUserTransactions(userId)
      set({ transactions: txns, isLoading: false })
    } catch { set({ isLoading: false }) }
  },
  addTransaction: (transaction) => {
    const newTxn: Transaction = { ...transaction, id: `txn-${Date.now()}`, createdAt: new Date().toISOString() }
    set(state => ({ transactions: [newTxn, ...state.transactions] }))
  },
}))

// ==================== Notification Store ====================
interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: (userId: string) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: (userId: string) => void
  addNotification: (n: Notification) => void
}
export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async (userId) => {
    try {
      const notifs = await notificationAPI.getUserNotifications(userId)
      set({ notifications: notifs, unreadCount: notifs.filter((n: Notification) => !n.isRead).length })
    } catch { set({ notifications: [], unreadCount: 0 }) }
  },
  markAsRead: async (id) => {
    set(state => {
      const updated = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      return { notifications: updated, unreadCount: updated.filter(n => !n.isRead).length }
    })
    try { await notificationAPI.markAsRead(id) } catch {}
  },
  markAllAsRead: async (userId) => {
    set(state => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true })), unreadCount: 0 }))
    try { await notificationAPI.markAllAsRead(userId) } catch {}
  },
  addNotification: (n) => {
    set(state => ({ notifications: [n, ...state.notifications], unreadCount: state.unreadCount + (n.isRead ? 0 : 1) }))
  },
}))

// ==================== Gacha Store ====================
interface GachaState {
  pulls: GachaPull[]
  isLoading: boolean
  addPull: (pull: Omit<GachaPull, 'id' | 'createdAt'>) => void
  fetchPullHistory: (userId: string) => Promise<void>
}
export const useGachaStore = create<GachaState>()((set) => ({
  pulls: [],
  isLoading: false,
  addPull: (pull) => {
    const newPull: GachaPull = { ...pull, id: `pull-${Date.now()}`, createdAt: new Date().toISOString() }
    set(state => ({ pulls: [newPull, ...state.pulls] }))
  },
  fetchPullHistory: async (userId) => {
    set({ isLoading: true })
    try {
      const pulls = await gachaAPI.getUserPulls(userId)
      set({ pulls, isLoading: false })
    } catch { set({ pulls: [], isLoading: false }) }
  },
}))

// ==================== Admin User Store ====================
interface AdminUserState {
  users: User[]
  isLoading: boolean
  fetchUsers: () => Promise<void>
  updateRole: (userId: string, role: User['role']) => Promise<void>
  updateKYC: (userId: string, status: User['kycStatus']) => Promise<void>
  adjustBalance: (userId: string, amount: number) => Promise<void>
}
export const useAdminUserStore = create<AdminUserState>()((set) => ({
  users: [],
  isLoading: false,
  fetchUsers: async () => {
    set({ isLoading: true })
    try {
      const users = await userAPI.getAllUsers()
      set({ users, isLoading: false })
    } catch { set({ users: [], isLoading: false }) }
  },
  updateRole: async (userId, role) => {
    try { await userAPI.updateUserRole(userId, role) } catch {}
    set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, role } : u) }))
  },
  updateKYC: async (userId, status) => {
    try { await userAPI.updateKYCStatus(userId, status) } catch {}
    set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, kycStatus: status } : u) }))
  },
  adjustBalance: async (userId, amount) => {
    try {
      const { supabase } = await import('./supabase')
      await supabase.rpc('admin_adjust_balance', { p_user_id: userId, p_amount: amount })
    } catch {}
    set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, balance: Math.max(0, u.balance + amount) } : u) }))
  },
}))
