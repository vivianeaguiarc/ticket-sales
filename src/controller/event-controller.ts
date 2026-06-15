import { Router } from 'express'

import { getGetEventByIdUseCase, getGetEventsUseCase } from '../infra/composition/event-factory.js'
import { toEventModel, toEventModels } from '../shared/mappers/event-mapper.js'

export const eventsRoutes = Router()

eventsRoutes.get('/', async (_req, res) => {
  const events = await getGetEventsUseCase().execute()

  res.json(toEventModels(events))
})

eventsRoutes.get('/:eventId', async (req, res) => {
  const { eventId } = req.params
  const event = await getGetEventByIdUseCase().execute({ eventId: +eventId })

  if (!event) {
    res.status(404).json({ message: 'Event not found' })
    return
  }

  res.json(toEventModel(event))
})
