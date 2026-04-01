import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'

type FindAllParams = {
  where?: {
    purchase_id?: number
    ticket_id?: number
  }
}

export class PurchaseTicketModel {
  id: number
  purchase_id: number
  ticket_id: number

  constructor(data: Partial<PurchaseTicketModel> = {}) {
    this.id = 0
    this.purchase_id = 0
    this.ticket_id = 0

    this.fill(data)
  }

  fill(data: Partial<PurchaseTicketModel>) {
    if (data.id !== undefined) this.id = data.id
    if (data.purchase_id !== undefined) this.purchase_id = data.purchase_id
    if (data.ticket_id !== undefined) this.ticket_id = data.ticket_id
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
    items: Array<{
      purchase_id: number
      ticket_id: number
    }>,
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseTicketModel[]> {
    const db = options?.connection ?? Database.getInstance()

    const valuesSql = items.map(() => '(?, ?)').join(', ')
    const values = items.flatMap((item) => [item.purchase_id, item.ticket_id])

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES ${valuesSql}`,
      values
    )

    return items.map((item, index) => {
      return new PurchaseTicketModel({
        id: result.insertId + index,
        purchase_id: item.purchase_id,
        ticket_id: item.ticket_id
      })
    })
  }

  static async findById(
    id: number,
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseTicketModel | null> {
    const db = options?.connection ?? Database.getInstance()

    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM purchase_tickets WHERE id = ? LIMIT 1',
      [id]
    )

    if (!rows.length) return null

    return new PurchaseTicketModel(rows[0] as PurchaseTicketModel)
  }

  static async findAll(
    params?: FindAllParams,
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseTicketModel[]> {
    const db = options?.connection ?? Database.getInstance()

    const conditions: string[] = []
    const values: Array<number> = []

    if (params?.where?.purchase_id !== undefined) {
      conditions.push('purchase_id = ?')
      values.push(params.where.purchase_id)
    }

    if (params?.where?.ticket_id !== undefined) {
      conditions.push('ticket_id = ?')
      values.push(params.where.ticket_id)
    }

    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT * FROM purchase_tickets${whereClause}`

    const [rows] = await db.execute<RowDataPacket[]>(query, values)

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
