import { Router } from 'express'

import { PartnerService } from '../services/partner-service.js'
import { TicketService } from '../services/ticket-service.js'

export const ticketRoutes = Router()

ticketRoutes.post('/:eventId/tickets', async (req, res) => {
  const userId = req.user!.id
  const partnerService = new PartnerService()
  const partner = await partnerService.findByUserId(userId)

  if (!partner) {
    return res.status(403).json({ message: 'Only partners can create tickets' })
  }

  const { numTickets, price } = req.body
  const { eventId } = req.params

  const ticketService = new TicketService()
  await ticketService.createMany({ eventId: +eventId, numTickets, price })

  res.status(204).send()
})
