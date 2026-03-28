import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'
import { PartnerModel } from './partner-model.js'

export class EventModel {
  id: number
  partner_id: number
  name: string
  description: string | null
  date: Date
  location: string
  created_at: Date
  partner?: PartnerModel

  constructor(data: Partial<EventModel> = {}) {
    this.fill(data)
  }

  static async create(
    data: {
      partner_id: number
      name: string
      description: string | null
      date: Date
      location: string
    },
    options?: { connection?: PoolConnection }
  ): Promise<EventModel> {
    const db = options?.connection ?? Database.getInstance()
    const created_at = new Date()

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO events (partner_id, name, description, date, location, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [data.partner_id, data.name, data.description, data.date, data.location, created_at]
    )

    const event = new EventModel({
      ...data,
      created_at,
      id: result.insertId
    })

    return event
  }

  static async findById(id: number, options?: { partner?: boolean }): Promise<EventModel | null> {
    const db = Database.getInstance()
    let query = 'SELECT * FROM events WHERE id = ?'

    if (options?.partner) {
      query = `
        SELECT 
          e.*,
          p.id as partner_id,
          p.user_id as partner_user_id,
          p.company_name as partner_company_name,
          p.created_at as partner_created_at
        FROM events e
        INNER JOIN partners p ON p.id = e.partner_id
        WHERE e.id = ?
      `
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, [id])

    if (rows.length === 0) return null

    const event = new EventModel(rows[0] as EventModel)

    if (options?.partner) {
      event.partner = new PartnerModel({
        id: rows[0].partner_id,
        user_id: rows[0].partner_user_id,
        company_name: rows[0].partner_company_name,
        created_at: rows[0].partner_created_at
      })
    }

    return event
  }

  static async findAll(filter?: { where?: { partner_id?: number } }): Promise<EventModel[]> {
    const db = Database.getInstance()
    let query = 'SELECT * FROM events'
    const params = []

    if (filter && filter.where) {
      if (filter.where.partner_id) {
        query += ' WHERE partner_id = ?'
        params.push(filter.where.partner_id)
      }
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params)

    return rows.map((row) => new EventModel(row as EventModel))
  }

  async update(): Promise<void> {
    const db = Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE events SET partner_id = ?, name = ?, description = ?, date = ?, location = ? WHERE id = ?',
      [this.partner_id, this.name, this.description, this.date, this.location, this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Event not found')
    }
  }

  async delete(): Promise<void> {
    const db = Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>('DELETE FROM events WHERE id = ?', [this.id])

    if (result.affectedRows === 0) {
      throw new Error('Event not found')
    }
  }

  fill(data: Partial<EventModel>): void {
    if (data.id !== undefined) this.id = data.id
    if (data.partner_id !== undefined) this.partner_id = data.partner_id
    if (data.name !== undefined) this.name = data.name
    if (data.description !== undefined) this.description = data.description
    if (data.date !== undefined) this.date = data.date
    if (data.location !== undefined) this.location = data.location
    if (data.created_at !== undefined) this.created_at = data.created_at
    if (data.partner !== undefined) this.partner = data.partner
  }
}
