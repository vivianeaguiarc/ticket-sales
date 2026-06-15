import { Customer } from '../../domain/entities/customer.js'
import { CustomerModel } from '../../models/customer-model.js'

export function toCustomerModel(customer: Customer): CustomerModel {
  return new CustomerModel({
    id: customer.id,
    user_id: customer.userId,
    address: customer.address,
    phone: customer.phone,
    created_at: customer.createdAt
  })
}
