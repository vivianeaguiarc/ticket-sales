import { Purchase } from '../../domain/entities/purchase.js'
import { PurchaseModel } from '../../models/purchase-model.js'

export function toPurchaseModel(purchase: Purchase): PurchaseModel {
  return new PurchaseModel({
    id: purchase.id,
    customer_id: purchase.customerId,
    purchase_date: purchase.purchaseDate,
    total_amount: purchase.totalAmount,
    status: purchase.status
  })
}
