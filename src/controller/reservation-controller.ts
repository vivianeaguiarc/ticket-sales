import { Request, Response, Router } from 'express'

import { CustomerService } from '../services/customer-service.js'
import { CreateReservationUseCase } from '../use-cases/create-reservation-use-case.js'

export const reservationRoutes = Router()

reservationRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const customerService = new CustomerService()
    const customer = await customerService.findByUserId(req.user!.id)

    if (!customer) {
      return res.status(400).json({ message: 'User needs be a customer' })
    }

    const { ticket_ids } = req.body

    if (!Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      return res.status(400).json({ message: 'ticket_ids is required' })
    }

    const reservations = await CreateReservationUseCase.execute({
      customer_id: customer.id,
      ticket_ids
    })

    return res.status(201).json(reservations)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ticket_ids is required') {
        return res.status(400).json({ message: error.message })
      }

      if (error.message === 'Some tickets not found') {
        return res.status(404).json({ message: error.message })
      }

      if (error.message.includes('not available')) {
        return res.status(409).json({ message: error.message })
      }
    }

    return res.status(500).json({ message: 'Internal server error' })
  }
})
