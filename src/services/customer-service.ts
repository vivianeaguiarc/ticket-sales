import { Database } from '../database.js'
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

    const connection = await Database.getInstance().getConnection()

    try {
      await connection.beginTransaction()

      const user = await UserModel.create(
        {
          name,
          email,
          password
        },
        { connection }
      )

      const customer = await CustomerModel.create(
        {
          user_id: user.id,
          address,
          phone
        },
        { connection }
      )

      await connection.commit()

      return {
        id: customer.id,
        userId: user.id,
        name,
        address,
        phone,
        createdAt: customer.created_at
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
