import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'

export enum TicketStatus {
  available = 'available',
  reserved = 'reserved',
  sold = 'sold'
}

export class TicketModel {
  id: number
  location: string
  event_id: number
  price: number
  status: TicketStatus
  created_at: Date

  constructor(data: Partial<TicketModel> = {}) {
    this.fill(data)
  }

  static async create(
    data: {
      location: string
      event_id: number
      price: number
      status: TicketStatus
    },
    options?: { connection?: PoolConnection }
  ): Promise<TicketModel> {
    const db = options?.connection ?? Database.getInstance()
    const created_at = new Date()
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO tickets (location, event_id, price, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [data.location, data.event_id, data.price, data.status, created_at]
    )
    const ticket = new TicketModel({
      ...data,
      created_at,
      id: result.insertId
    })
    return ticket
  }

  static async createMany(
    data: {
      location: string
      event_id: number
      price: number
      status: TicketStatus
    }[],
    options?: { connection?: PoolConnection }
  ): Promise<TicketModel[]> {
    const db = options?.connection ?? Database.getInstance()
    const created_at = new Date()
    const values = Array(data.length).fill('(?, ?, ?, ?, ?)').join(', ')
    const params = data.reduce<(string | number | Date)[]>(
      (acc, ticket) => [
        ...acc,
        ticket.location,
        ticket.event_id,
        ticket.price,
        ticket.status,
        created_at
      ],
      []
    )
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO tickets (location, event_id, price, status, created_at) VALUES ${values}`,
      params
    )
    const tickets = data.map(
      (ticket, index) =>
        new TicketModel({
          ...ticket,
          created_at,
          id: result.insertId + index
        })
    )
    return tickets
  }

  static async findById(id: number): Promise<TicketModel | null> {
    const db = Database.getInstance()
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM tickets WHERE id = ?', [id])
    return rows.length ? new TicketModel(rows[0] as TicketModel) : null
  }

  static async findAll(
    filter?: {
      where?: { event_id?: number; ids?: number[]; status?: TicketStatus }
    },
    options?: { connection?: PoolConnection }
  ): Promise<TicketModel[]> {
    const db = options?.connection ?? Database.getInstance()
    let query = 'SELECT * FROM tickets'
    const params: (string | number)[] = []

    if (filter && filter.where) {
      const where = []

      if (filter.where.event_id) {
        where.push('event_id = ?')
        params.push(filter.where.event_id)
      }

      if (filter.where.ids) {
        where.push(`id IN (${filter.where.ids.map(() => '?').join(', ')})`)
        params.push(...filter.where.ids)
      }

      if (filter.where.status) {
        where.push('status = ?')
        params.push(filter.where.status)
      }

      query += ` WHERE ${where.join(' AND ')}`
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params)
    return rows.map((row) => new TicketModel(row as TicketModel))
  }

  async update(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE tickets SET location = ?, event_id = ?, price = ?, status = ? WHERE id = ?',
      [this.location, this.event_id, this.price, this.status, this.id]
    )
    if (result.affectedRows === 0) {
      throw new Error('Ticket not found')
    }
  }

  async delete(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()
    const [result] = await db.execute<ResultSetHeader>('DELETE FROM tickets WHERE id = ?', [
      this.id
    ])
    if (result.affectedRows === 0) {
      throw new Error('Ticket not found')
    }
  }

  fill(data: Partial<TicketModel>): void {
    if (data.id !== undefined) this.id = data.id
    if (data.location !== undefined) this.location = data.location
    if (data.event_id !== undefined) this.event_id = data.event_id
    if (data.price !== undefined) this.price = data.price
    if (data.status !== undefined) this.status = data.status
    if (data.created_at !== undefined) this.created_at = data.created_at
  }
}
