import { Router } from 'express'

import { EventService } from '../services/event-service.js'

export const eventsRoutes = Router()

eventsRoutes.get('/', async (_req, res) => {
  const eventService = new EventService()
  const events = await eventService.findAll()
  res.json(events)
})

eventsRoutes.get('/:eventId', async (req, res) => {
  const { eventId } = req.params
  const eventService = new EventService()
  const event = await eventService.findById(+eventId)

  if (!event) {
    res.status(404).json({ message: 'Event not found' })
    return
  }
  res.json(event)
})
