import { Purchase, PurchaseStatus } from '../../domain/entities/purchase.js'
import {
  CreatePurchaseData,
  PurchaseRepository
} from '../../domain/repositories/purchase-repository.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { PurchaseModel } from '../../models/purchase-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function toDomainPurchase(model: PurchaseModel): Purchase {
  return new Purchase(
    model.id,
    model.customer_id,
    model.purchase_date,
    model.total_amount,
    model.status as PurchaseStatus
  )
}

export class MysqlPurchaseRepository implements PurchaseRepository {
  async create(data: CreatePurchaseData, options?: RepositoryQueryOptions): Promise<Purchase> {
    const connection = resolveMysqlConnection(options?.scope)
    const purchase = await PurchaseModel.create(
      {
        customer_id: data.customerId,
        total_amount: data.totalAmount,
        status: data.status
      },
      { connection }
    )

    return toDomainPurchase(purchase)
  }

  async findById(purchaseId: number, options?: RepositoryQueryOptions): Promise<Purchase | null> {
    const connection = resolveMysqlConnection(options?.scope)
    const purchase = await PurchaseModel.findById(purchaseId, {
      connection,
      forUpdate: options?.forUpdate
    })

    return purchase ? toDomainPurchase(purchase) : null
  }

  async markAsCancelled(purchaseId: number, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)
    const purchase = await PurchaseModel.findById(purchaseId, { connection })

    if (!purchase) {
      throw new Error('Purchase not found')
    }

    purchase.status = PurchaseStatus.cancelled
    await purchase.update({ connection })
  }
}
