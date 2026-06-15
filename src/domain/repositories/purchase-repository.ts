import { Purchase, PurchaseStatus } from '../entities/purchase.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreatePurchaseData {
  customerId: number
  totalAmount: number
  status: PurchaseStatus
}

export interface PurchaseRepository {
  create(data: CreatePurchaseData, options?: RepositoryQueryOptions): Promise<Purchase>
  findById(purchaseId: number, options?: RepositoryQueryOptions): Promise<Purchase | null>
  markAsCancelled(purchaseId: number, options?: RepositoryQueryOptions): Promise<void>
}
