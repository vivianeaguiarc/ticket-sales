import { getCreatePurchaseUseCase } from '../infra/composition/purchase-factory.js'
import { toPurchaseModel } from '../shared/mappers/purchase-mapper.js'

interface LegacyInput {
  customer_id: number
  user_id: number
  ticket_ids: number[]
}

/**
 * Facade legado que delega para o use case da camada application.
 * Mantido para compatibilidade com imports existentes e testes de regressão.
 */
export class CreatePurchaseUseCase {
  static async execute(input: LegacyInput) {
    const purchase = await getCreatePurchaseUseCase().execute({
      customerId: input.customer_id,
      userId: input.user_id,
      ticketIds: input.ticket_ids
    })

    return toPurchaseModel(purchase)
  }
}
