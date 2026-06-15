import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'

export enum PurchaseStatus {
  pending = 'pending',
  paid = 'paid',
  error = 'error',
  cancelled = 'cancelled'
}

export class PurchaseModel {
  id: number = 0
  customer_id: number = 0
  purchase_date: Date
  total_amount: number = 0
  status: PurchaseStatus

  constructor(data: Partial<PurchaseModel> = {}) {
    this.fill(data)
  }

  static async create(
    data: {
      customer_id: number
      total_amount: number
      status: PurchaseStatus
    },
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseModel> {
    const db = options?.connection ?? Database.getInstance()
    const purchase_date = new Date()

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO purchases (customer_id, total_amount, status, purchase_date) VALUES (?, ?, ?, ?)',
      [data.customer_id, data.total_amount, data.status, purchase_date]
    )

    const purchase = new PurchaseModel({
      ...data,
      purchase_date,
      id: result.insertId
    })

    return purchase
  }

  static async findById(
    id: number,
    options?: { connection?: PoolConnection; forUpdate?: boolean }
  ): Promise<PurchaseModel | null> {
    const db = options?.connection ?? Database.getInstance()

    let query = 'SELECT * FROM purchases WHERE id = ?'
    if (options?.forUpdate) {
      query += ' FOR UPDATE'
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, [id])

    return rows.length ? new PurchaseModel(rows[0] as PurchaseModel) : null
  }

  static async findAll(
    filter?: {
      where?: {
        customer_id?: number
        status?: PurchaseStatus
      }
    },
    options?: { connection?: PoolConnection }
  ): Promise<PurchaseModel[]> {
    const db = options?.connection ?? Database.getInstance()

    let query = 'SELECT * FROM purchases'
    const params: (number | string)[] = []

    if (filter?.where) {
      const where: string[] = []

      if (filter.where.customer_id !== undefined) {
        where.push('customer_id = ?')
        params.push(filter.where.customer_id)
      }

      if (filter.where.status !== undefined) {
        where.push('status = ?')
        params.push(filter.where.status)
      }

      if (where.length > 0) {
        query += ` WHERE ${where.join(' AND ')}`
      }
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params)

    return rows.map((row) => new PurchaseModel(row as PurchaseModel))
  }

  async update(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE purchases SET customer_id = ?, total_amount = ?, status = ? WHERE id = ?',
      [this.customer_id, this.total_amount, this.status, this.id]
    )

    if (result.affectedRows === 0) {
      throw new Error('Purchase not found')
    }
  }

  async delete(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance()

    const [result] = await db.execute<ResultSetHeader>('DELETE FROM purchases WHERE id = ?', [
      this.id
    ])

    if (result.affectedRows === 0) {
      throw new Error('Purchase not found')
    }
  }

  fill(data: Partial<PurchaseModel>): void {
    this.id = data.id ?? this.id ?? 0
    this.customer_id = data.customer_id ?? this.customer_id ?? 0
    this.purchase_date = data.purchase_date ?? this.purchase_date
    this.total_amount = data.total_amount ?? this.total_amount ?? 0
    this.status = data.status ?? this.status
  }
}
