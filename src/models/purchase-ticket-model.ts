import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'

export class PurchaseTicketModel {
  id: number = 0
  purchase_id: number = 0
  ticket_id: number = 0

  constructor(data: Partial<PurchaseTicketModel> = {}) {
    this.fill(data)
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

    return new PurchaseTicketModel({
      id: result.insertId,
      purchase_id: data.purchase_id,
      ticket_id: data.ticket_id
    })
  }

  static async createMany(
    data: {
      purchase_id: number
      ticket_id: number
    }[],
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseTicketModel[]> {
    const db = options?.connection ?? Database.getInstance()

    const values = data.map(() => '(?, ?)').join(', ')
    const params = data.flatMap((item) => [item.purchase_id, item.ticket_id])

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES ${values}`,
      params
    )

    return data.map((item, index) => {
      return new PurchaseTicketModel({
        id: result.insertId + index,
        purchase_id: item.purchase_id,
        ticket_id: item.ticket_id
      })
    })
  }

  static async findById(id: number): Promise<PurchaseTicketModel | null> {
    const db = Database.getInstance()

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM purchase_tickets WHERE id = ?',
      [id]
    )

    return rows.length ? new PurchaseTicketModel(rows[0] as PurchaseTicketModel) : null
  }

  static async findAll(
    filter?: {
      where?: {
        purchase_id?: number
        ticket_id?: number[]
      }
    },
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseTicketModel[]> {
    const db = options?.connection ?? Database.getInstance()

    let query = 'SELECT * FROM purchase_tickets'
    const params: number[] = []

    if (filter?.where) {
      const where: string[] = []

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

  fill(data: Partial<PurchaseTicketModel>): void {
    this.id = data.id ?? this.id ?? 0
    this.purchase_id = data.purchase_id ?? this.purchase_id ?? 0
    this.ticket_id = data.ticket_id ?? this.ticket_id ?? 0
  }
}
