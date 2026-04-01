import { Request, Response, Router } from 'express'

import { CustomerService } from '../services/customer-service.js'
import { PaymentService } from '../services/payment-service.js'
import { PurchaseService } from '../services/purchase-service.js'
import { CreatePurchaseUseCase } from '../use-cases/create-purchase-use-case.js'

export const purchaseRoutes = Router()

purchaseRoutes.post('/', async (req: Request, res: Response) => {
  try {
    console.log('🟡 [purchaseRoutes.create] body recebido:', req.body)
    console.log('🟡 [purchaseRoutes.create] req.user:', req.user)

    const customerService = new CustomerService()
    const customer = await customerService.findByUserId(req.user!.id)

    console.log('🟢 [purchaseRoutes.create] customer encontrado:', customer)

    if (!customer) {
      console.log('🔴 [purchaseRoutes.create] usuário autenticado não é customer')
      res.status(400).json({ message: 'User needs be a customer' })
      return
    }

    const { ticket_ids, card_token } = req.body

    console.log('🟡 [purchaseRoutes.create] ticket_ids:', ticket_ids)
    console.log('🟡 [purchaseRoutes.create] card_token:', card_token)

    if (!Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      console.log('🔴 [purchaseRoutes.create] ticket_ids inválido')
      res.status(400).json({ message: 'ticket_ids is required' })
      return
    }

    if (!card_token) {
      console.log('🔴 [purchaseRoutes.create] card_token ausente')
      res.status(400).json({ message: 'card_token is required' })
      return
    }

    const purchase = await CreatePurchaseUseCase.execute({
      customer_id: customer.id,
      ticket_ids
    })

    console.log('🟢 [purchaseRoutes.create] purchase criada com sucesso:', purchase)

    res.status(201).json(purchase)
  } catch (error) {
    console.error('🔴 [purchaseRoutes.create] erro completo:', error)

    if (error instanceof Error) {
      if (error.message === 'ticket_ids is required') {
        res.status(400).json({ message: error.message })
        return
      }

      if (error.message === 'Some tickets not found') {
        res.status(404).json({ message: error.message })
        return
      }

      if (error.message.includes('is not available')) {
        res.status(409).json({ message: error.message })
        return
      }
    }

    res.status(500).json({ message: 'Internal server error' })
  }
})

purchaseRoutes.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    console.log('🟡 [purchaseRoutes.cancel] id recebido:', req.params.id)

    const purchaseService = new PurchaseService(new PaymentService())

    await purchaseService.cancel(Number(req.params.id))

    console.log('🟢 [purchaseRoutes.cancel] compra cancelada com sucesso')

    res.status(200).json({ message: 'Purchase cancelled successfully' })
  } catch (error) {
    console.error('🔴 [purchaseRoutes.cancel] erro completo:', error)

    if (error instanceof Error) {
      if (error.message === 'Purchase not found') {
        res.status(404).json({ message: error.message })
        return
      }
    }

    res.status(500).json({ message: 'Internal server error' })
  }
})
