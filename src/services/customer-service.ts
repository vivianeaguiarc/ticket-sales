import bcrypt from 'bcrypt'

import { CustomerModel } from '../models/customer-model.js'
import { UserModel } from '../models/user-model.js'

export class CustomerService {
  async register(data: {
    name: string
    email: string
    password: string
    address: string
    phone: string
  }) {
    const { name, email, password, address, phone } = data
    const hashedPassword = bcrypt.hashSync(password, 10)
    const userModel = await UserModel.create({ name, email, password: hashedPassword })
    const userId = userModel.id

    const customerModel = await CustomerModel.create({
      user_id: userId,
      address,
      phone
    })

    return {
      id: customerModel.id,
      userId,
      name,
      address,
      phone,
      createdAt: customerModel.created_at
    }
  }
}
