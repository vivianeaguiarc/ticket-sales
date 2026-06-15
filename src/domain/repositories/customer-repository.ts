import { Customer } from '../entities/customer.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreateCustomerData {
  userId: number
  address: string
  phone: string
}

export interface CustomerRepository {
  create(data: CreateCustomerData, options?: RepositoryQueryOptions): Promise<Customer>
  findByUserId(userId: number): Promise<Customer | null>
}
