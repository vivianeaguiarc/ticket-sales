import { getCancelPurchaseUseCase } from '../infra/composition/purchase-factory.js'

interface LegacyInput {
  purchase_id: number
  user_id: number
}

/**
 * Facade legado que delega para o use case da camada application.
 * Mantido para compatibilidade com imports existentes e testes de regressão.
 */
export class CancelPurchaseUseCase {
  static async execute(input: LegacyInput): Promise<void> {
    await getCancelPurchaseUseCase().execute({
      purchaseId: input.purchase_id,
      userId: input.user_id
    })
  }
}
