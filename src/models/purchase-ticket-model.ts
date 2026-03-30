import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'

export class PurchaseTicketModel {
  id: number
  purchase_id: number
  ticket_id: number

  constructor(data: Partial<PurchaseTicketModel> = {}) {
    this.fill(data)
  }

  fill(data: Partial<PurchaseTicketModel>) {
    this.id = data.id ?? 0
    this.purchase_id = data.purchase_id ?? 0
    this.ticket_id = data.ticket_id ?? 0
  }

  static async create(
    data: {
      purchase_id: number
      ticket_id: number
    },
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseTicketModel> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES (?, ?)',
      [data.purchase_id, data.ticket_id]
    )

    const purchaseTicket = new PurchaseTicketModel({
      ...data,
      id: result.insertId
    })

    return purchaseTicket
  }

  static async createMany(
    data: {
      purchase_id: number
      ticket_id: number
    }[],
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseTicketModel[]> {
    const db = options?.connection ?? Database.getInstance()

    const params = data.reduce<number[]>(
      (acc, ticket) => [...acc, ticket.purchase_id, ticket.ticket_id],
      []
    )

    const values = Array(data.length).fill('(?, ?)').join(', ')

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES ${values}`,
      params
    )

    return data.map(
      (ticket, index) =>
        new PurchaseTicketModel({
          ...ticket,
          id: result.insertId + index
        })
    )
  }

  static async findById(id: number): Promise<PurchaseTicketModel | null> {
    const db = Database.getInstance()

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM purchase_tickets WHERE id = ?',
      [id]
    )

    return rows.length ? new PurchaseTicketModel(rows[0] as PurchaseTicketModel) : null
  }

  static async findAll(filter?: {
    where?: { purchase_id?: number; ticket_id?: number[] }
  }): Promise<PurchaseTicketModel[]> {
    const db = Database.getInstance()

    let query = 'SELECT * FROM purchase_tickets'
    const params: number[] = []

    if (filter?.where) {
      const where = []

      if (filter.where.purchase_id !== undefined) {
        where.push('purchase_id = ?')
        params.push(filter.where.purchase_id)
      }

      if (filter.where.ticket_id && filter.where.ticket_id.length > 0) {
        where.push(`ticket_id IN (${filter.where.ticket_id.map(() => '?').join(', ')})`)
        params.push(...filter.where.ticket_id)
      }

      if (where.length > 0) {
        query += ` WHERE ${where.join(' AND ')}`
      }
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params)

    return rows.map((row) => new PurchaseTicketModel(row as PurchaseTicketModel))
  }

  async update(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE purchase_tickets SET purchase_id = ?, ticket_id = ? WHERE id = ?',
      [this.purchase_id, this.ticket_id, this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Purchase ticket not found')
    }
  }

  async delete(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM purchase_tickets WHERE id = ?',
      [this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Purchase ticket not found')
    }
  }
}
