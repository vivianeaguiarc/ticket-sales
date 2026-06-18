import { CustomerNotFoundError } from '../domain/errors/identity-errors.js'
import { getSharedCustomerRepository } from '../infra/composition/identity-factory.js'
import { PurchaseModel } from '../models/purchase-model.js'
import { ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { toCustomerModel } from '../shared/mappers/customer-mapper.js'
import type {
  CustomerPurchaseHistoryItem,
  CustomerReservationHistoryItem
} from '../shared/types/customer-history.js'

export class CustomerService {
  async findByUserId(userId: number) {
    const customer = await getSharedCustomerRepository().findByUserId(userId)

    return customer ? toCustomerModel(customer) : null
  }

  async listPurchasesByAuthenticatedCustomer(
    userId: number
  ): Promise<CustomerPurchaseHistoryItem[]> {
    const customer = await this.findByUserId(userId)

    if (!customer) {
      throw new CustomerNotFoundError()
    }

    return PurchaseModel.findByCustomerIdWithTicketsAndEvents(customer.id)
  }

  async listReservationsByAuthenticatedCustomer(
    userId: number
  ): Promise<CustomerReservationHistoryItem[]> {
    const customer = await this.findByUserId(userId)

    if (!customer) {
      throw new CustomerNotFoundError()
    }

    return ReservationTicketModel.findByCustomerIdWithTicketAndEvent(customer.id)
  }
}
