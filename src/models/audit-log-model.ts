import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import { Database } from '../database.js'

export enum AuditAction {
  EVENT_CREATED = 'EVENT_CREATED',
  TICKETS_CREATED = 'TICKETS_CREATED',
  TICKETS_RESERVED = 'TICKETS_RESERVED',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
  PURCHASE_CREATED = 'PURCHASE_CREATED',
  PURCHASE_CANCELLED = 'PURCHASE_CANCELLED'
}

export enum AuditEntityType {
  event = 'event',
  ticket = 'ticket',
  reservation = 'reservation',
  purchase = 'purchase'
}

export type AuditLogData = Record<string, unknown>

export class AuditLogModel {
  id: number = 0
  user_id: number | null = null
  action: AuditAction
  entity_type: AuditEntityType
  entity_id: number | null = null
  old_data: AuditLogData | null = null
  new_data: AuditLogData | null = null
  created_at: Date

  constructor(data: Partial<AuditLogModel> = {}) {
    this.fill(data)
  }

  static async create(
    data: {
      user_id?: number | null
      action: AuditAction
      entity_type: AuditEntityType
      entity_id?: number | null
      old_data?: AuditLogData | null
      new_data?: AuditLogData | null
    },
    options?: { connection?: PoolConnection }
  ): Promise<AuditLogModel> {
    const db = options?.connection ?? Database.getInstance()
    const created_at = new Date()

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        data.user_id ?? null,
        data.action,
        data.entity_type,
        data.entity_id ?? null,
        data.old_data ? JSON.stringify(data.old_data) : null,
        data.new_data ? JSON.stringify(data.new_data) : null,
        created_at
      ]
    )

    return new AuditLogModel({
      id: result.insertId,
      user_id: data.user_id ?? null,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id ?? null,
      old_data: data.old_data ?? null,
      new_data: data.new_data ?? null,
      created_at
    })
  }

  static async findById(id: number): Promise<AuditLogModel | null> {
    const db = Database.getInstance()

    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM audit_logs WHERE id = ?', [id])

    if (!rows.length) {
      return null
    }

    return AuditLogModel.fromRow(rows[0] as RowDataPacket)
  }

  static async findAll(
    filter?: {
      where?: {
        user_id?: number
        action?: AuditAction
        entity_type?: AuditEntityType
        entity_id?: number
      }
    },
    options?: { connection?: PoolConnection }
  ): Promise<AuditLogModel[]> {
    const db = options?.connection ?? Database.getInstance()

    let query = 'SELECT * FROM audit_logs'
    const params: (number | string)[] = []

    if (filter?.where) {
      const where: string[] = []

      if (filter.where.user_id !== undefined) {
        where.push('user_id = ?')
        params.push(filter.where.user_id)
      }

      if (filter.where.action !== undefined) {
        where.push('action = ?')
        params.push(filter.where.action)
      }

      if (filter.where.entity_type !== undefined) {
        where.push('entity_type = ?')
        params.push(filter.where.entity_type)
      }

      if (filter.where.entity_id !== undefined) {
        where.push('entity_id = ?')
        params.push(filter.where.entity_id)
      }

      if (where.length > 0) {
        query += ` WHERE ${where.join(' AND ')}`
      }
    }

    query += ' ORDER BY created_at DESC'

    const [rows] = await db.execute<RowDataPacket[]>(query, params)

    return rows.map((row) => AuditLogModel.fromRow(row))
  }

  private static fromRow(row: RowDataPacket): AuditLogModel {
    return new AuditLogModel({
      id: row.id as number,
      user_id: row.user_id as number | null,
      action: row.action as AuditAction,
      entity_type: row.entity_type as AuditEntityType,
      entity_id: row.entity_id as number | null,
      old_data: AuditLogModel.parseJson(row.old_data),
      new_data: AuditLogModel.parseJson(row.new_data),
      created_at: row.created_at as Date
    })
  }

  private static parseJson(value: unknown): AuditLogData | null {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'object') {
      return value as AuditLogData
    }

    if (typeof value === 'string') {
      return JSON.parse(value) as AuditLogData
    }

    return null
  }

  fill(data: Partial<AuditLogModel>): void {
    this.id = data.id ?? this.id ?? 0
    this.user_id = data.user_id ?? this.user_id ?? null
    this.action = data.action ?? this.action
    this.entity_type = data.entity_type ?? this.entity_type
    this.entity_id = data.entity_id ?? this.entity_id ?? null
    this.old_data = data.old_data ?? this.old_data ?? null
    this.new_data = data.new_data ?? this.new_data ?? null
    this.created_at = data.created_at ?? this.created_at
  }
}
