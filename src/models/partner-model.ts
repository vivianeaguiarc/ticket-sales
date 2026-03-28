import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'
import { UserModel } from './user-model.js'

export class PartnerModel {
  id: number
  user_id: number
  company_name: string
  created_at: Date
  user?: UserModel

  constructor(data: Partial<PartnerModel> = {}) {
    this.fill(data)
  }

  static async create(
    data: { user_id: number; company_name: string },
    options?: { connection?: PoolConnection }
  ): Promise<PartnerModel> {
    const db = options?.connection ?? Database.getInstance()
    const created_at = new Date()

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO partners (user_id, company_name, created_at) VALUES (?, ?, ?)',
      [data.user_id, data.company_name, created_at]
    )

    return new PartnerModel({
      ...data,
      created_at,
      id: result.insertId
    })
  }

  static async findById(id: number, options?: { user?: boolean }): Promise<PartnerModel | null> {
    const db = Database.getInstance()

    let query = 'SELECT * FROM partners WHERE id = ?'

    if (options?.user) {
      query = `
        SELECT 
          p.*, 
          users.id as user_id, 
          users.name as user_name, 
          users.email as user_email
        FROM partners p
        INNER JOIN users ON users.id = p.user_id
        WHERE p.id = ?
      `
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, [id])

    if (rows.length === 0) return null

    const partner = new PartnerModel(rows[0] as PartnerModel)

    if (options?.user) {
      partner.user = new UserModel({
        id: rows[0].user_id,
        name: rows[0].user_name,
        email: rows[0].user_email
      } as Partial<UserModel>)
    }

    return partner
  }

  static async findByUserId(
    userId: number,
    options?: { user?: boolean }
  ): Promise<PartnerModel | null> {
    const db = Database.getInstance()

    let query = 'SELECT * FROM partners WHERE user_id = ?'

    if (options?.user) {
      query = `
        SELECT 
          p.*, 
          users.id as user_id, 
          users.name as user_name, 
          users.email as user_email
        FROM partners p
        INNER JOIN users ON users.id = p.user_id
        WHERE p.user_id = ?
      `
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, [userId])

    if (rows.length === 0) return null

    const partner = new PartnerModel(rows[0] as PartnerModel)

    if (options?.user) {
      partner.user = new UserModel({
        id: rows[0].user_id,
        name: rows[0].user_name,
        email: rows[0].user_email
      } as Partial<UserModel>)
    }

    return partner
  }

  static async findAll(): Promise<PartnerModel[]> {
    const db = Database.getInstance()

    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM partners')

    return rows.map((row) => new PartnerModel(row as PartnerModel))
  }

  async update(): Promise<void> {
    const db = Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE partners SET user_id = ?, company_name = ? WHERE id = ?',
      [this.user_id, this.company_name, this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Partner not found')
    }
  }

  async delete(): Promise<void> {
    const db = Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>('DELETE FROM partners WHERE id = ?', [
      this.id
    ])

    if (result.affectedRows === 0) {
      throw new Error('Partner not found')
    }
  }

  fill(data: Partial<PartnerModel>): void {
    if (data.id !== undefined) this.id = data.id
    if (data.user_id !== undefined) this.user_id = data.user_id
    if (data.company_name !== undefined) this.company_name = data.company_name
    if (data.created_at !== undefined) this.created_at = data.created_at
    if (data.user !== undefined) this.user = data.user
  }
}
