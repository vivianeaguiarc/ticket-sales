import { Customer } from '../../domain/entities/customer.js'
import {
  CreateCustomerData,
  CustomerRepository
} from '../../domain/repositories/customer-repository.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { CustomerModel } from '../../models/customer-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function toDomainCustomer(model: CustomerModel): Customer {
  return new Customer(model.id, model.user_id, model.address, model.phone, model.created_at)
}

export class MysqlCustomerRepository implements CustomerRepository {
  async create(data: CreateCustomerData, options?: RepositoryQueryOptions): Promise<Customer> {
    const connection = resolveMysqlConnection(options?.scope)
    const customer = await CustomerModel.create(
      {
        user_id: data.userId,
        address: data.address,
        phone: data.phone
      },
      { connection }
    )

    return toDomainCustomer(customer)
  }

  async findByUserId(userId: number): Promise<Customer | null> {
    const customer = await CustomerModel.findByUserId(userId)

    return customer ? toDomainCustomer(customer) : null
  }
}
