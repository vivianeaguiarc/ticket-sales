import {
  getCreateTicketsUseCase,
  getGetEventTicketsUseCase,
  getGetTicketByIdUseCase
} from '../infra/composition/ticket-factory.js'
import { toTicketModels } from '../shared/mappers/ticket-mapper.js'

/**
 * Facade legado que delega para os use cases da camada application.
 * Mantido para compatibilidade com imports existentes e testes de regressão.
 */
export class TicketService {
  async createMany(data: { eventId: number; numTickets: number; price: number; userId: number }) {
    await getCreateTicketsUseCase().execute({
      eventId: data.eventId,
      numTickets: data.numTickets,
      price: data.price,
      userId: data.userId
    })
  }

  async findByEventId(eventId: number) {
    const tickets = await getGetEventTicketsUseCase().execute({ eventId })

    return toTicketModels(tickets)
  }

  async findById(eventId: number, ticketId: number) {
    const ticket = await getGetTicketByIdUseCase().execute({ eventId, ticketId })

    return ticket ? toTicketModels([ticket])[0] : null
  }
}
