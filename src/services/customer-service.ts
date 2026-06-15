import { getSharedCustomerRepository } from '../infra/composition/identity-factory.js'
import { toCustomerModel } from '../shared/mappers/customer-mapper.js'

export class CustomerService {
  async findByUserId(userId: number) {
    const customer = await getSharedCustomerRepository().findByUserId(userId)

    return customer ? toCustomerModel(customer) : null
  }
}
