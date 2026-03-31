import { Router } from 'express'

import { CustomerService } from '../services/customer-service.js'
import { PartnerService } from '../services/partner-service.js'
import { TicketService } from '../services/ticket-service.js'
import { CancelPurchaseUseCase } from '../use-cases/cancel-purchase-use-case.js'
import { PurchaseTicketUseCase } from '../use-cases/purchase-ticket-use-case.js'
import { ReserveTicketUseCase } from '../use-cases/reserve-ticket-use-case.js'

export const ticketRoutes = Router()

ticketRoutes.post('/:eventId/tickets', async (req, res) => {
  const userId = req.user!.id
  const partnerService = new PartnerService()
  const partner = await partnerService.findByUserId(userId)

  if (!partner) {
    res.status(403).json({ message: 'Not authorized' })
    return
  }

  const { num_tickets, price } = req.body
  const { eventId } = req.params
  const ticketService = new TicketService()

  await ticketService.createMany({
    eventId: +eventId,
    numTickets: num_tickets,
    price
  })

  res.status(204).send()
})

ticketRoutes.get('/:eventId/tickets', async (req, res) => {
  const { eventId } = req.params
  const ticketService = new TicketService()
  const data = await ticketService.findByEventId(+eventId)

  res.json(data)
})

ticketRoutes.get('/:eventId/tickets/:ticketId', async (req, res) => {
  const { eventId, ticketId } = req.params
  const ticketService = new TicketService()
  const ticket = await ticketService.findById(+eventId, +ticketId)

  if (!ticket) {
    res.status(404).json({ message: 'Ticket not found' })
    return
  }

  res.json(ticket)
})

ticketRoutes.post('/reservations', async (req, res) => {
  try {
    const userId = req.user!.id
    const { ticket_ids } = req.body

    const customerService = new CustomerService()
    const customer = await customerService.findByUserId(userId)

    if (!customer) {
      res.status(403).json({ message: 'Not authorized' })
      return
    }

    const result = await ReserveTicketUseCase.execute({
      customer_id: customer.id,
      ticket_ids
    })

    res.status(201).json(result)
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Customer id is required' ||
        error.message === 'At least one ticket id is required'
      ) {
        res.status(400).json({ message: error.message })
        return
      }

      if (error.message === 'Ticket is no longer available') {
        res.status(409).json({ message: error.message })
        return
      }
    }

    res.status(500).json({ message: 'Internal server error' })
  }
})

ticketRoutes.post('/purchases', async (req, res) => {
  try {
    const userId = req.user!.id
    const { ticket_ids } = req.body

    const customerService = new CustomerService()
    const customer = await customerService.findByUserId(userId)

    if (!customer) {
      res.status(403).json({ message: 'Not authorized' })
      return
    }

    const result = await PurchaseTicketUseCase.execute({
      customer_id: customer.id,
      ticket_ids
    })

    res.status(201).json(result)
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Customer id is required' ||
        error.message === 'At least one ticket id is required'
      ) {
        res.status(400).json({ message: error.message })
        return
      }

      if (
        error.message === 'Ticket is no longer available' ||
        error.message === 'Ticket is not reserved'
      ) {
        res.status(409).json({ message: error.message })
        return
      }

      if (error.message === 'One or more tickets not found') {
        res.status(404).json({ message: error.message })
        return
      }
    }

    res.status(500).json({ message: 'Internal server error' })
  }
})

ticketRoutes.delete('/purchases/:purchaseId', async (req, res) => {
  try {
    const { purchaseId } = req.params

    await CancelPurchaseUseCase.execute({
      purchase_id: +purchaseId
    })

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Purchase id is required') {
        res.status(400).json({ message: error.message })
        return
      }

      if (error.message === 'Purchase tickets not found') {
        res.status(404).json({ message: error.message })
        return
      }
    }

    res.status(500).json({ message: 'Internal server error' })
  }
})
