import { Database } from '../database.js'
import { PartnerModel } from '../models/partner-model.js'
import { UserModel } from '../models/user-model.js'

export class PartnerService {
  async register(data: { name: string; email: string; password: string; company_name: string }) {
    const { name, email, password, company_name } = data
    const connection = await Database.getInstance().getConnection()

    try {
      await connection.beginTransaction()
      const user = await UserModel.create({ name, email, password }, { connection })
      const partner = await PartnerModel.create({ user_id: user.id, company_name }, { connection })
      await connection.commit()
      return {
        id: partner.id,
        name,
        userId: user.id,
        company_name,
        createdAt: partner.created_at
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      await connection.end()
    }
  }

  async findById(id: number) {
    return PartnerModel.findById(id)
  }

  async findByUserId(userId: number) {
    return PartnerModel.findByUserId(userId)
  }

  async findAll() {
    return PartnerModel.findAll()
  }
}
