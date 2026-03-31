import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'
import { TicketStatus } from './ticket-model.js'

export class TicketStatusHistoryModel {
  id: number = 0
  ticket_id: number = 0
  from_status: TicketStatus
  to_status: TicketStatus
  changed_at: Date

  constructor(data: Partial<TicketStatusHistoryModel> = {}) {
    this.fill(data)
  }

  static async create(
    data: {
      ticket_id: number
      from_status: TicketStatus
      to_status: TicketStatus
    },
    options?: { connection?: PoolConnection }
  ): Promise<TicketStatusHistoryModel> {
    const db = options?.connection ?? Database.getInstance()
    const changed_at = new Date()

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO ticket_status_history (ticket_id, from_status, to_status, changed_at) VALUES (?, ?, ?, ?)',
      [data.ticket_id, data.from_status, data.to_status, changed_at]
    )

    return new TicketStatusHistoryModel({
      id: result.insertId,
      ticket_id: data.ticket_id,
      from_status: data.from_status,
      to_status: data.to_status,
      changed_at
    })
  }

  static async findById(id: number): Promise<TicketStatusHistoryModel | null> {
    const db = Database.getInstance()

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM ticket_status_history WHERE id = ?',
      [id]
    )

    return rows.length ? new TicketStatusHistoryModel(rows[0] as TicketStatusHistoryModel) : null
  }

  static async findAll(
    filter?: {
      where?: {
        ticket_id?: number
        from_status?: TicketStatus
        to_status?: TicketStatus
      }
    },
    options?: { connection?: PoolConnection }
  ): Promise<TicketStatusHistoryModel[]> {
    const db = options?.connection ?? Database.getInstance()

    let query = 'SELECT * FROM ticket_status_history'
    const params: (number | string)[] = []

    if (filter?.where) {
      const where: string[] = []

      if (filter.where.ticket_id !== undefined) {
        where.push('ticket_id = ?')
        params.push(filter.where.ticket_id)
      }

      if (filter.where.from_status !== undefined) {
        where.push('from_status = ?')
        params.push(filter.where.from_status)
      }

      if (filter.where.to_status !== undefined) {
        where.push('to_status = ?')
        params.push(filter.where.to_status)
      }

      if (where.length > 0) {
        query += ` WHERE ${where.join(' AND ')}`
      }
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params)

    return rows.map((row) => new TicketStatusHistoryModel(row as TicketStatusHistoryModel))
  }

  async delete(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM ticket_status_history WHERE id = ?',
      [this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Ticket status history not found')
    }
  }

  fill(data: Partial<TicketStatusHistoryModel>): void {
    this.id = data.id ?? this.id ?? 0
    this.ticket_id = data.ticket_id ?? this.ticket_id ?? 0
    this.from_status = data.from_status ?? this.from_status
    this.to_status = data.to_status ?? this.to_status
    this.changed_at = data.changed_at ?? this.changed_at
  }
}
