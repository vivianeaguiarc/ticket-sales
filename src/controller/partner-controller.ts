import { Router } from 'express'

import {
  getCreateEventUseCase,
  getGetEventByIdUseCase,
  getGetPartnerEventsUseCase
} from '../infra/composition/event-factory.js'
import { EventService } from '../services/event-service.js'
import { PartnerService } from '../services/partner-service.js'
import { toEventModel, toEventModels } from '../shared/mappers/event-mapper.js'

export const partnerRoutes = Router()

partnerRoutes.post('/register', async (_req, res) => {
  const { name, email, password, company_name } = _req.body
  const partnerService = new PartnerService()
  const result = await partnerService.register({ name, email, password, company_name })
  res.status(201).json(result)
})

partnerRoutes.post('/events', async (req, res) => {
  const { name, description, date, location } = req.body
  const userId = req.user!.id
  const partnerService = new PartnerService()
  const partner = await partnerService.findByUserId(userId)

  if (!partner) {
    res.status(403).json({ message: 'Not authorized' })
    return
  }

  const event = await getCreateEventUseCase().execute({
    name,
    description,
    date: new Date(date),
    location,
    partnerId: partner.id,
    userId
  })

  res.status(201).json(toEventModel(event))
})

partnerRoutes.get('/events', async (req, res) => {
  const userId = req.user!.id
  const partnerService = new PartnerService()
  const partner = await partnerService.findByUserId(userId)

  if (!partner) {
    res.status(403).json({ message: 'Not authorized' })
    return
  }

  const events = await getGetPartnerEventsUseCase().execute({ partnerId: partner.id })

  res.json(toEventModels(events))
})

partnerRoutes.get('/events/:eventId', async (req, res) => {
  const { eventId } = req.params
  const userId = req.user!.id
  const partnerService = new PartnerService()
  const partner = await partnerService.findByUserId(userId)

  if (!partner) {
    res.status(403).json({ message: 'Not authorized' })
    return
  }

  const event = await getGetEventByIdUseCase().execute({ eventId: +eventId })

  if (!event || event.partnerId !== partner.id) {
    res.status(404).json({ message: 'Event not found' })
    return
  }

  res.json(toEventModel(event))
})

partnerRoutes.get('/events/:eventId/history', async (req, res) => {
  const { eventId } = req.params
  const userId = req.user!.id
  const partnerService = new PartnerService()
  const partner = await partnerService.findByUserId(userId)

  if (!partner) {
    res.status(403).json({ message: 'Not authorized' })
    return
  }

  const event = await getGetEventByIdUseCase().execute({ eventId: +eventId })

  if (!event) {
    res.status(404).json({ message: 'Event not found' })
    return
  }

  if (event.partnerId !== partner.id) {
    res.status(403).json({ message: 'Not authorized' })
    return
  }

  const eventService = new EventService()
  const history = await eventService.getHistory(+eventId)

  res.json(history)
})
