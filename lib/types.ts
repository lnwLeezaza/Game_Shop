// ==================== User Types ====================
export type UserRole = 'buyer' | 'seller' | 'admin'
export type KYCStatus = 'pending' | 'verified' | 'rejected'

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string
  role: UserRole
  balance: number
  kycStatus: KYCStatus
  createdAt: string
  updatedAt: string
}

// ==================== Product Types ====================
export type GameCategory = 'rov' | 'freefire' | 'efootball' | 'pubg' | 'genshin' | 'roblox' | 'other'
export type ProductStatus = 'available' | 'sold' | 'reserved' | 'hidden'
export type ProductType = 'account' | 'item' | 'topup' | 'skin'

export interface Product {
  id: string
  sellerId: string
  sellerName: string
  title: string
  description: string
  price: number
  originalPrice?: number
  category: GameCategory
  type: ProductType
  status: ProductStatus
  images: string[]
  details: Record<string, string>
  tags: string[]
views: number
  createdAt: string
  updatedAt: string
  stockPool?: string
}

// ==================== Order Types ====================
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'disputed' | 'refunded' | 'cancelled'

export interface Order {
  id: string
  productId: string
  productTitle: string
  productImage: string
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  amount: number
  platformFee: number
  sellerReceives: number
  status: OrderStatus
  escrowReleaseAt?: string
  deliveryInfo?: string
  createdAt: string
  updatedAt: string
}

// ==================== Transaction Types ====================
export type TransactionType = 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'refund' | 'gacha' | 'fee'
export type TransactionStatus = 'pending' | 'completed' | 'failed'

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  balanceBefore: number
  balanceAfter: number
  status: TransactionStatus
  description: string
  referenceId?: string
  createdAt: string
}

// ==================== Gacha Types ====================
export type GachaRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface GachaPool {
  id: string
  name: string
  nameTh: string
  description: string
  descriptionTh: string
  category: GameCategory
  price: number
  image: string
  isActive: boolean
  items: GachaItem[]
  totalPulls: number
  createdAt: string
}

export interface GachaItem {
  id: string
  poolId: string
  name: string
  nameTh: string
  rarity: GachaRarity
  dropRate: number
  image: string
  value: number
}

export interface GachaPull {
  id: string
  poolId: string
  userId: string
  itemId: string
  item: GachaItem
  seed: string
  createdAt: string
}

// ==================== Review Types ====================
export interface Review {
  id: string
  orderId: string
  buyerId: string
  buyerName: string
  buyerAvatar?: string
  sellerId: string
  rating: number
  comment: string
  createdAt: string
}

// ==================== Notification Types ====================
export type NotificationType = 'order' | 'payment' | 'gacha' | 'system' | 'dispute'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  titleTh: string
  message: string
  messageTh: string
  isRead: boolean
  link?: string
  createdAt: string
}

// ==================== Dispute Types ====================
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed'

export interface Dispute {
  id: string
  orderId: string
  reporterId: string
  reporterName: string
  reason: string
  evidence: string[]
  status: DisputeStatus
  adminNotes?: string
  resolution?: string
  createdAt: string
  resolvedAt?: string
}

// ==================== Audit Log Types ====================
export type AuditAction = 
  | 'user_register'
  | 'user_login'
  | 'user_logout'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'order_create'
  | 'order_complete'
  | 'order_dispute'
  | 'gacha_pull'
  | 'deposit'
  | 'withdrawal'
  | 'admin_action'

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  details: Record<string, unknown>
  ip?: string
  userAgent?: string
  createdAt: string
}

// ==================== Deposit Types ====================
export interface Deposit {
  id: string
  user_id: string
  amount: number
  slip_url: string
  status: 'pending' | 'approved' | 'rejected'
  payment_method?: string
  qr_code?: string
  slip_uploaded_at?: string
  reviewed_at?: string
  reviewed_by?: string
  admin_note?: string
  created_at: string
  // joined:
  userName?: string
}

export interface ShopSettings {
  promptpay_number: string
  promptpay_name: string
  promptpay_qr_url: string
  bank_name: string
  bank_account: string
  bank_account_name: string
}

// ==================== Filter & Pagination Types ====================
export interface ProductFilters {
  category?: GameCategory
  type?: ProductType
  minPrice?: number
  maxPrice?: number
  search?: string
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
