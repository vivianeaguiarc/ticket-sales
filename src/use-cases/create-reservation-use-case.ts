import { getCreateReservationUseCase } from '../infra/composition/create-reservation-factory.js'
import { toReservationTicketModels } from '../shared/mappers/reservation-mapper.js'

interface LegacyInput {
  customer_id: number
  user_id: number
  ticket_ids: number[]
}

/**
 * Facade legado que delega para o use case da camada application.
 * Mantido para compatibilidade com imports existentes e testes de regressão.
 */
export class CreateReservationUseCase {
  static async execute(input: LegacyInput) {
    const useCase = getCreateReservationUseCase()
    const reservations = await useCase.execute({
      customerId: input.customer_id,
      userId: input.user_id,
      ticketIds: input.ticket_ids
    })

    return toReservationTicketModels(reservations)
  }
}
