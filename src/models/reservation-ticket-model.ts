import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'

export enum ReservationStatus {
  reserved = 'reserved',
  cancelled = 'cancelled'
}

export class ReservationTicketModel {
  id: number
  customer_id: number
  ticket_id: number
  reservation_date: Date
  expires_at: Date
  status: ReservationStatus

  constructor(data: Partial<ReservationTicketModel> = {}) {
    this.fill(data)
  }

  static async create(
    data: {
      customer_id: number
      ticket_id: number
      status: ReservationStatus
      expires_at?: Date
    },
    options?: { connection?: PoolConnection }
  ): Promise<ReservationTicketModel> {
    const db = options?.connection ?? Database.getInstance()
    const reservation_date = new Date()
    const expires_at = data.expires_at ?? new Date(Date.now() + 5 * 60 * 1000)

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO reservation_tickets (customer_id, ticket_id, status, reservation_date, expires_at) VALUES (?, ?, ?, ?, ?)',
      [data.customer_id, data.ticket_id, data.status, reservation_date, expires_at]
    )

    const reservation = new ReservationTicketModel({
      ...data,
      reservation_date,
      expires_at,
      id: result.insertId
    })

    return reservation
  }

  static async findById(id: number): Promise<ReservationTicketModel | null> {
    const db = Database.getInstance()

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM reservation_tickets WHERE id = ?',
      [id]
    )

    return rows.length ? new ReservationTicketModel(rows[0] as ReservationTicketModel) : null
  }

  static async findAll(
    filter?: {
      where?: {
        customer_id?: number
        ticket_id?: number[]
        status?: ReservationStatus
        reserved_before?: Date
        expires_at?: Date
      }
    },
    options?: { connection?: PoolConnection; forUpdate?: boolean }
  ): Promise<ReservationTicketModel[]> {
    const db = options?.connection ?? Database.getInstance()

    let query = 'SELECT * FROM reservation_tickets'
    const params: (number | string | Date)[] = []

    if (filter?.where) {
      const where: string[] = []

      if (filter.where.customer_id !== undefined) {
        where.push('customer_id = ?')
        params.push(filter.where.customer_id)
      }

      if (filter.where.ticket_id && filter.where.ticket_id.length > 0) {
        where.push(`ticket_id IN (${filter.where.ticket_id.map(() => '?').join(', ')})`)
        params.push(...filter.where.ticket_id)
      }

      if (filter.where.status !== undefined) {
        where.push('status = ?')
        params.push(filter.where.status)
      }

      if (filter.where.reserved_before !== undefined) {
        where.push('reservation_date < ?')
        params.push(filter.where.reserved_before)
      }

      if (filter.where.expires_at !== undefined) {
        where.push('expires_at < ?')
        params.push(filter.where.expires_at)
      }

      if (where.length > 0) {
        query += ` WHERE ${where.join(' AND ')}`
      }
    }

    if (options?.forUpdate) {
      query += ' FOR UPDATE'
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params)

    return rows.map((row) => new ReservationTicketModel(row as ReservationTicketModel))
  }
  static async markAsCancelled(
    reservationId: number,
    options?: { connection?: PoolConnection }
  ): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE reservation_tickets SET status = ? WHERE id = ? AND status = ?',
      [ReservationStatus.cancelled, reservationId, ReservationStatus.reserved]
    )

    if (result.affectedRows === 0) {
      throw new Error('Reservation not found')
    }
  }
  async update(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE reservation_tickets SET customer_id = ?, ticket_id = ?, status = ?, expires_at = ? WHERE id = ?',
      [this.customer_id, this.ticket_id, this.status, this.expires_at, this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Reservation not found')
    }
  }

  async delete(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM reservation_tickets WHERE id = ?',
      [this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Reservation not found')
    }
  }

  fill(data: Partial<ReservationTicketModel>): void {
    if (data.id !== undefined) this.id = data.id
    if (data.customer_id !== undefined) this.customer_id = data.customer_id
    if (data.ticket_id !== undefined) this.ticket_id = data.ticket_id
    if (data.reservation_date !== undefined) this.reservation_date = data.reservation_date
    if (data.expires_at !== undefined) this.expires_at = data.expires_at
    if (data.status !== undefined) this.status = data.status
  }
}
