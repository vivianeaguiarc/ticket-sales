import { Request, Response, Router } from 'express'

import {
  getCancelPurchaseUseCase,
  getCreatePurchaseUseCase
} from '../infra/composition/purchase-factory.js'
import { CustomerService } from '../services/customer-service.js'
import { toPurchaseModel } from '../shared/mappers/purchase-mapper.js'

export const purchaseRoutes = Router()

purchaseRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const customerService = new CustomerService()
    const customer = await customerService.findByUserId(req.user!.id)

    if (!customer) {
      res.status(400).json({ message: 'User needs be a customer' })
      return
    }

    const { ticket_ids, card_token } = req.body

    if (!Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      res.status(400).json({ message: 'ticket_ids is required' })
      return
    }

    if (!card_token) {
      res.status(400).json({ message: 'card_token is required' })
      return
    }

    const purchase = await getCreatePurchaseUseCase().execute({
      customerId: customer.id,
      userId: req.user!.id,
      ticketIds: ticket_ids
    })

    res.status(201).json(toPurchaseModel(purchase))
  } catch (error) {
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
    await getCancelPurchaseUseCase().execute({
      purchaseId: Number(req.params.id),
      userId: req.user!.id
    })

    res.status(200).json({ message: 'Purchase cancelled successfully' })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Purchase not found') {
        res.status(404).json({ message: error.message })
        return
      }

      if (error.message === 'Purchase already cancelled') {
        res.status(409).json({ message: error.message })
        return
      }
    }

    res.status(500).json({ message: 'Internal server error' })
  }
})
