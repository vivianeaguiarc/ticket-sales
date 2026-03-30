import { Request, Response, Router } from 'express'

import { CustomerService } from '../services/customer-service.js'
import { PaymentService } from '../services/payment-service.js'
import { PurchaseService } from '../services/purchase-service.js'

export const purchaseRoutes = Router()

purchaseRoutes.post('/', async (req: Request, res: Response) => {
  const customerService = new CustomerService()
  const customer = await customerService.findByUserId(req.user!.id)

  if (!customer) {
    res.status(400).json({ message: 'User needs be a customer' })
    return
  }

  const { ticket_ids, card_token } = req.body
  const paymentService = new PaymentService()
  const purchaseService = new PurchaseService(paymentService)

  const newPurchaseId = await purchaseService.create({
    customerId: customer.id,
    ticketIds: ticket_ids,
    cardToken: card_token
  })

  const purchase = await purchaseService.findById(newPurchaseId)

  res.status(201).json(purchase)
})

purchaseRoutes.post('/:id/cancel', async (req: Request, res: Response) => {
  const purchaseService = new PurchaseService(new PaymentService())

  await purchaseService.cancel(Number(req.params.id))

  res.status(200).json({ message: 'Purchase cancelled successfully' })
})
