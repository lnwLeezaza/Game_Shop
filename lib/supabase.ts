import { createBrowserClient } from '@supabase/ssr'
import type {
  User,
  Product,
  Order,
  Transaction,
  Notification,
  GachaPull,
  GachaPool,
  GachaItem,
  Review,
  Dispute,
  AuditLog,
  ProductFilters,
  PaginatedResponse,
} from './types'

// ==================== Supabase Client ====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// ==================== Auth API ====================
export const authAPI = {
  async signUp(email: string, password: string, username: string) {
    // Supabase trigger handle_new_user สร้าง row ใน public.users อัตโนมัติ
    // ไม่ต้อง insert เอง — เพื่อป้องกัน conflict
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, displayName: username },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
      },
    })
    if (authError) throw authError
    // ถ้า Supabase ปิด email confirmation → authData.user จะมีทันที
    // ถ้าเปิด email confirmation → authData.user จะมี แต่ session ยังไม่มี
    return authData
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (data.user) {
      await supabase.from('audit_logs').insert({
        user_id: data.user.id,
        action: 'user_login',
        details: { email },
      })
    }
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// ==================== User API ====================
export const userAPI = {
  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return mapUser(data)
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: updates.displayName,
        avatar: updates.avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return mapUser(data)
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapUser)
  },

  async updateUserRole(userId: string, role: User['role']) {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId)
    if (error) throw error
  },

  async updateKYCStatus(userId: string, status: User['kycStatus']) {
    const { error } = await supabase.from('users').update({ kyc_status: status }).eq('id', userId)
    if (error) throw error
  },

  async getBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data.balance
  },
}

// ==================== Product API ====================
export const productAPI = {
  async getProducts(filters?: ProductFilters, page = 1, limit = 20): Promise<PaginatedResponse<Product>> {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'available')

    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.minPrice) query = query.gte('price', filters.minPrice)
    if (filters?.maxPrice) query = query.lte('price', filters.maxPrice)
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

    const sortMap: Record<string, { column: string; ascending: boolean }> = {
      price_asc: { column: 'price', ascending: true },
      price_desc: { column: 'price', ascending: false },
      newest: { column: 'created_at', ascending: false },
      popular: { column: 'views', ascending: false },
    }
    const sort = filters?.sortBy ? sortMap[filters.sortBy] : { column: 'created_at', ascending: false }
    query = query.order(sort.column, { ascending: sort.ascending })

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: data.map(mapProduct),
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  },

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error

    // Increment view count
    await supabase.rpc('increment_product_views', { product_id: id })

    return mapProduct(data)
  },

  async getSellerProducts(sellerId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapProduct)
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        seller_id: product.sellerId,
        seller_name: product.sellerName,
        title: product.title,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        category: product.category,
        type: product.type,
        status: product.status,
        images: product.images,
        details: product.details,
        tags: product.tags,
        views: 0,
      stock_pool: (product as any).stockPool || 'none',
      is_on_sale: (product as any).is_on_sale ?? false,
      discount_percent: (product as any).discount_percent ?? null,

        
      })
      .select()
      .single()
    if (error) throw error
    return mapProduct(data)
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const { error } = await supabase
      .from('products')
      .update({
        title: updates.title,
        description: updates.description,
        price: updates.price,
        status: updates.status,
        images: updates.images,
        details: updates.details,
        tags: updates.tags,
        updated_at: new Date().toISOString(),
        
       // ใหม่ — เพิ่ม 2 บรรทัดนี้
      ...((updates as any).stockPool !== undefined && { stock_pool: (updates as any).stockPool }),
      ...((updates as any).is_on_sale !== undefined && { is_on_sale: (updates as any).is_on_sale }),
      ...((updates as any).discount_percent !== undefined && { discount_percent: (updates as any).discount_percent }),
      ...((updates as any).is_featured !== undefined && { is_featured: (updates as any).is_featured }),
      ...((updates as any).original_price !== undefined && { original_price: (updates as any).originalPrice }),
      ...((updates as any).popup_enabled !== undefined && { popup_enabled: (updates as any).popup_enabled }),
      ...((updates as any).popup_badge !== undefined && { popup_badge: (updates as any).popup_badge }),
      ...((updates as any).popup_label !== undefined && { popup_label: (updates as any).popup_label }),
      ...((updates as any).popup_expires_at !== undefined && { popup_expires_at: (updates as any).popup_expires_at }),
      })
      .eq('id', id)
    if (error) throw error
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapProduct)
  },
}

// ==================== Order API ====================
export const orderAPI = {
  async createOrder(productId: string, buyerId: string): Promise<Order> {
    const { data, error } = await supabase.rpc('create_order', {
      p_product_id: productId,
      p_buyer_id: buyerId,
    })
    if (error) throw error
    return mapOrder(data)
  },

  async getOrder(id: string): Promise<Order> {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
    if (error) throw error
    return mapOrder(data)
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapOrder)
  },

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapOrder)
  },

  async updateOrderStatus(orderId: string, status: Order['status'], deliveryInfo?: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status, delivery_info: deliveryInfo, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) throw error
  },

  async confirmDelivery(orderId: string, buyerId: string) {
    const { data, error } = await supabase.rpc('confirm_delivery', {
      p_order_id: orderId,
      p_buyer_id: buyerId,
    })
    if (error) throw error
    return data
  },

  async forceComplete(orderId: string) {
    const { error } = await supabase.rpc('admin_force_complete', { p_order_id: orderId })
    if (error) throw error
  },

  async refundOrder(orderId: string) {
    const { error } = await supabase.rpc('admin_refund_order', { p_order_id: orderId })
    if (error) throw error
  },
}

// ==================== Transaction API ====================
export const transactionAPI = {
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapTransaction)
  },

  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapTransaction)
  },

  async createDeposit(userId: string, amount: number, slipUrl: string) {
    const { data, error } = await supabase
      .from('deposits')
      .insert({ user_id: userId, amount, slip_url: slipUrl, status: 'pending' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getDeposits(status?: string) {
    let query = supabase.from('deposits').select('*, users(username, display_name)').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async approveDeposit(depositId: string, adminId: string) {
    const { error } = await supabase.rpc('approve_deposit', {
      p_deposit_id: depositId,
      p_admin_id: adminId,
    })
    if (error) throw error
  },

  async rejectDeposit(depositId: string, adminId: string, reason: string) {
    const { error } = await supabase
      .from('deposits')
      .update({ status: 'rejected', admin_note: reason, reviewed_by: adminId })
      .eq('id', depositId)
    if (error) throw error
  },

  async createWithdrawal(userId: string, amount: number, bankAccount: string, bankName: string) {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert({ user_id: userId, amount, bank_account: bankAccount, bank_name: bankName, status: 'pending' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getWithdrawals(status?: string) {
    let query = supabase.from('withdrawals').select('*, users(username, display_name)').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async approveWithdrawal(withdrawalId: string, adminId: string) {
    const { error } = await supabase.rpc('approve_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_admin_id: adminId,
    })
    if (error) throw error
  },

  async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string) {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected', admin_note: reason, reviewed_by: adminId })
      .eq('id', withdrawalId)
    if (error) throw error
  },
}

// ==================== Notification API ====================
export const notificationAPI = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data.map(mapNotification)
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    if (error) throw error
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    if (error) throw error
  },

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    const { error } = await supabase.from('notifications').insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      title_th: notification.titleTh,
      message: notification.message,
      message_th: notification.messageTh,
      is_read: false,
      link: notification.link,
    })
    if (error) throw error
  },

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        callback(mapNotification(payload.new))
      })
      .subscribe()
  },
}

// ==================== Gacha API ====================
export const gachaAPI = {
  async getPools(): Promise<GachaPool[]> {
    const { data, error } = await supabase
      .from('gacha_pools')
      .select('*, gacha_items(*)')
      .eq('is_active', true)
    if (error) throw error
    return data.map(mapGachaPool)
  },

  async pullGacha(poolId: string, userId: string): Promise<GachaPull> {
    const { data, error } = await supabase.rpc('do_gacha_pull', {
      p_pool_id: poolId,
      p_user_id: userId,
    })
    if (error) throw error
    return data
  },

  async getUserPulls(userId: string): Promise<GachaPull[]> {
    const { data, error } = await supabase
      .from('gacha_pulls')
      .select('*, gacha_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapGachaPull)
  },
}

// ==================== Review API ====================
export const reviewAPI = {
  async getProductReviews(productId: string): Promise<Review[]> {
    // reviews ไม่มี product_id โดยตรง — join ผ่าน orders
    const { data, error } = await supabase
      .from('reviews')
      .select('*, orders!inner(product_id)')
      .eq('orders.product_id', productId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapReview)
  },

  async getSellerReviews(sellerId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapReview)
  },

  async getUserReviews(userId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapReview)
  },

  async createReview(review: Omit<Review, 'id' | 'createdAt'>) {
    const { error } = await supabase.from('reviews').insert({
      order_id: review.orderId,
      buyer_id: review.buyerId,
      buyer_name: review.buyerName,
      buyer_avatar: review.buyerAvatar,
      seller_id: review.sellerId,
      rating: review.rating,
      comment: review.comment,
    })
    if (error) throw error
  },
}

// ==================== Dispute API ====================
export const disputeAPI = {
  async createDispute(orderId: string, reporterId: string, reporterName: string, reason: string) {
    const { data, error } = await supabase
      .from('disputes')
      .insert({ order_id: orderId, reporter_id: reporterId, reporter_name: reporterName, reason, status: 'open' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getAllDisputes(): Promise<Dispute[]> {
    const { data, error } = await supabase.from('disputes').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapDispute)
  },

  async updateDispute(id: string, updates: Partial<Dispute>) {
    const { error } = await supabase.from('disputes').update({
      status: updates.status,
      admin_notes: updates.adminNotes,
      resolution: updates.resolution,
      resolved_at: updates.resolvedAt,
    }).eq('id', id)
    if (error) throw error
  },

  async releaseEscrow(disputeId: string, orderId: string) {
    const { error } = await supabase.rpc('release_escrow', { p_order_id: orderId, p_dispute_id: disputeId })
    if (error) throw error
  },

  async refundBuyer(disputeId: string, orderId: string) {
    const { error } = await supabase.rpc('refund_buyer', { p_order_id: orderId, p_dispute_id: disputeId })
    if (error) throw error
  },
}

// ==================== Realtime Subscriptions ====================
export const realtimeAPI = {
  subscribeToOrder(orderId: string, callback: (order: Order) => void) {
    return supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => callback(mapOrder(payload.new)))
      .subscribe()
  },

  subscribeToUserBalance(userId: string, callback: (balance: number) => void) {
    return supabase
      .channel(`balance:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => callback(payload.new.balance))
      .subscribe()
  },
}

// ==================== Storage API ====================
export const storageAPI = {
  async uploadSlip(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('slips').upload(fileName, file)
    if (error) throw error
    const { data } = supabase.storage.from('slips').getPublicUrl(fileName)
    return data.publicUrl
  },

  async uploadProductImage(sellerId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const fileName = `${sellerId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) throw error
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  },
}

// ==================== Admin API ====================
export const adminAPI = {
  async getDashboardStats() {
    const [usersRes, productsRes, ordersRes, revenueRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'available'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('amount').eq('type', 'fee'),
    ])
    const revenue = revenueRes.data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0
    return {
      totalUsers: usersRes.count ?? 0,
      activeProducts: productsRes.count ?? 0,
      totalOrders: ordersRes.count ?? 0,
      totalRevenue: revenue,
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data.map(mapAuditLog)
  },
}

// ==================== Data Mappers ====================
function mapUser(d: Record<string, unknown>): User {
  return {
    id: d.id as string,
    email: d.email as string,
    username: d.username as string,
    displayName: (d.display_name as string) || (d.username as string),
    avatar: d.avatar as string | undefined,
    role: d.role as User['role'],
    balance: d.balance as number,
    kycStatus: (d.kyc_status as User['kycStatus']) || 'pending',
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

function mapProduct(d: Record<string, unknown>): Product {
  return {
    id: d.id as string,
    sellerId: d.seller_id as string,
    sellerName: d.seller_name as string,
    title: d.title as string,
    description: d.description as string,
    price: d.price as number,
    originalPrice: d.original_price as number | undefined,
    category: d.category as Product['category'],
    type: d.type as Product['type'],
    status: d.status as Product['status'],
    images: (d.images as string[]) || [],
    details: (d.details as Record<string, string>) || {},
    tags: (d.tags as string[]) || [],
    views: d.views as number,
    createdAt: d.created_at as string,
updatedAt: d.updated_at as string,
    // ใหม่
    stockPool: (d.stock_pool as string) || 'none',
    is_on_sale: (d.is_on_sale as boolean) ?? false,
    discount_percent: (d.discount_percent as number) ?? null,
  }
}
function mapOrder(d: Record<string, unknown>): Order {
  return {
    id: d.id as string,
    productId: d.product_id as string,
    productTitle: d.product_title as string,
    productImage: d.product_image as string,
    buyerId: d.buyer_id as string,
    buyerName: d.buyer_name as string,
    sellerId: d.seller_id as string,
    sellerName: d.seller_name as string,
    amount: d.amount as number,
    platformFee: d.platform_fee as number,
    sellerReceives: d.seller_receives as number,
    status: d.status as Order['status'],
    escrowReleaseAt: d.escrow_release_at as string | undefined,
    deliveryInfo: d.delivery_info as string | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

function mapTransaction(d: Record<string, unknown>): Transaction {
  return {
    id: d.id as string,
    userId: d.user_id as string,
    type: d.type as Transaction['type'],
    amount: d.amount as number,
    balanceBefore: d.balance_before as number,
    balanceAfter: d.balance_after as number,
    status: d.status as Transaction['status'],
    description: d.description as string,
    referenceId: d.reference_id as string | undefined,
    createdAt: d.created_at as string,
  }
}

function mapNotification(d: Record<string, unknown>): Notification {
  return {
    id: d.id as string,
    userId: d.user_id as string,
    type: d.type as Notification['type'],
    title: d.title as string,
    titleTh: d.title_th as string,
    message: d.message as string,
    messageTh: d.message_th as string,
    isRead: d.is_read as boolean,
    link: d.link as string | undefined,
    createdAt: d.created_at as string,
  }
}

function mapGachaPool(d: Record<string, unknown>): GachaPool {
  return {
    id: d.id as string,
    name: d.name as string,
    nameTh: d.name_th as string,
    description: d.description as string,
    descriptionTh: d.description_th as string,
    category: d.category as GachaPool['category'],
    price: d.price as number,
    image: d.image as string,
    isActive: d.is_active as boolean,
    items: ((d.gacha_items as unknown[]) || []).map(mapGachaItem),
    totalPulls: d.total_pulls as number,
    createdAt: d.created_at as string,
  }
}

function mapGachaItem(d: unknown): GachaItem {
  const item = d as Record<string, unknown>
  return {
    id: item.id as string,
    poolId: item.pool_id as string,
    name: item.name as string,
    nameTh: item.name_th as string,
    rarity: item.rarity as GachaItem['rarity'],
    dropRate: item.drop_rate as number,
    image: item.image as string,
    value: item.value as number,
  }
}

function mapGachaPull(d: Record<string, unknown>): GachaPull {
  return {
    id: d.id as string,
    poolId: d.pool_id as string,
    userId: d.user_id as string,
    itemId: d.item_id as string,
    item: mapGachaItem(d.gacha_items),
    seed: d.seed as string,
    createdAt: d.created_at as string,
  }
}

function mapReview(d: Record<string, unknown>): Review {
  return {
    id: d.id as string,
    orderId: d.order_id as string,
    buyerId: d.buyer_id as string,
    buyerName: d.buyer_name as string,
    buyerAvatar: d.buyer_avatar as string | undefined,
    sellerId: d.seller_id as string,
    rating: d.rating as number,
    comment: d.comment as string,
    createdAt: d.created_at as string,
  }
}

function mapDispute(d: Record<string, unknown>): Dispute {
  return {
    id: d.id as string,
    orderId: d.order_id as string,
    reporterId: d.reporter_id as string,
    reporterName: d.reporter_name as string,
    reason: d.reason as string,
    evidence: (d.evidence as string[]) || [],
    status: d.status as Dispute['status'],
    adminNotes: d.admin_notes as string | undefined,
    resolution: d.resolution as string | undefined,
    createdAt: d.created_at as string,
    resolvedAt: d.resolved_at as string | undefined,
  }
}

function mapAuditLog(d: Record<string, unknown>): AuditLog {
  return {
    id: d.id as string,
    userId: d.user_id as string,
    action: d.action as AuditLog['action'],
    details: (d.details as Record<string, unknown>) || {},
    ip: d.ip as string | undefined,
    userAgent: d.user_agent as string | undefined,
    createdAt: d.created_at as string,
  }
}
