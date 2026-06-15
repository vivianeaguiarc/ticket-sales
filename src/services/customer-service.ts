import {
  getRegisterCustomerUseCase,
  getSharedCustomerRepository
} from '../infra/composition/identity-factory.js'
import { toCustomerModel } from '../shared/mappers/customer-mapper.js'

export class CustomerService {
  async register(data: {
    name: string
    email: string
    password: string
    address: string
    phone: string
  }) {
    return getRegisterCustomerUseCase().execute(data)
  }

  async findByUserId(userId: number) {
    const customer = await getSharedCustomerRepository().findByUserId(userId)

    return customer ? toCustomerModel(customer) : null
  }
}
