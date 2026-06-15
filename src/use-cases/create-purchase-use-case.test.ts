import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Database } from '../database.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
import { PurchaseModel, PurchaseStatus } from '../models/purchase-model.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'
import { CreatePurchaseUseCase } from './create-purchase-use-case.js'

describe('CreatePurchaseUseCase', () => {
  const beginTransactionMock = vi.fn()
  const commitMock = vi.fn()
  const rollbackMock = vi.fn()
  const releaseMock = vi.fn()

  const connection = {
    beginTransaction: beginTransactionMock,
    commit: commitMock,
    rollback: rollbackMock,
    release: releaseMock
  }

  const getConnectionMock = vi.fn()

  let findAllMock: ReturnType<typeof vi.spyOn>
  let sellIfAvailableMock: ReturnType<typeof vi.spyOn>
  let createPurchaseMock: ReturnType<typeof vi.spyOn>
  let createHistoryMock: ReturnType<typeof vi.spyOn>
  let createPurchaseTicketMock: ReturnType<typeof vi.spyOn>
  let createAuditLogMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)

    getConnectionMock.mockResolvedValue(connection)

    vi.spyOn(Database, 'getInstance').mockReturnValue({
      getConnection: getConnectionMock
    } as unknown as ReturnType<typeof Database.getInstance>)

    findAllMock = vi.spyOn(TicketModel, 'findAll').mockResolvedValue([
      { id: 1, status: TicketStatus.available, price: 100 },
      { id: 2, status: TicketStatus.available, price: 100 }
    ] as never)
    sellIfAvailableMock = vi.spyOn(TicketModel, 'sellIfAvailable').mockResolvedValue(undefined)
    createPurchaseMock = vi.spyOn(PurchaseModel, 'create').mockResolvedValue({ id: 10 } as never)
    createHistoryMock = vi.spyOn(TicketStatusHistoryModel, 'create').mockResolvedValue({} as never)
    createPurchaseTicketMock = vi
      .spyOn(PurchaseTicketModel, 'create')
      .mockResolvedValue({} as never)
    createAuditLogMock = vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never)
  })

  it('deve comprar tickets disponíveis com sucesso', async () => {
    const result = await CreatePurchaseUseCase.execute({
      customer_id: 1,
      user_id: 10,
      ticket_ids: [1, 2]
    })

    expect(result.id).toBe(10)
    expect(findAllMock).toHaveBeenCalledWith(
      { where: { ids: [1, 2] } },
      { connection, forUpdate: true }
    )
    expect(sellIfAvailableMock).toHaveBeenCalledTimes(2)
    expect(createPurchaseMock).toHaveBeenCalledTimes(1)
    expect(createPurchaseTicketMock).toHaveBeenCalledTimes(2)
    expect(createHistoryMock).toHaveBeenCalledTimes(2)
    expect(createAuditLogMock).toHaveBeenCalledWith(
      {
        user_id: 10,
        action: AuditAction.PURCHASE_CREATED,
        entity_type: AuditEntityType.purchase,
        entity_id: 10,
        old_data: null,
        new_data: {
          customer_id: 1,
          ticket_ids: [1, 2],
          total_amount: 200,
          status: PurchaseStatus.paid
        }
      },
      { connection }
    )
    expect(commitMock).toHaveBeenCalled()
    expect(rollbackMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  it('deve lançar erro se ticket_ids estiver vazio', async () => {
    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: []
      })
    ).rejects.toThrow('ticket_ids is required')
  })

  it('deve lançar erro se ticket não for encontrado', async () => {
    findAllMock.mockResolvedValue([{ id: 1, status: TicketStatus.available, price: 100 }] as never)

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1, 2]
      })
    ).rejects.toThrow('Some tickets not found')

    expect(sellIfAvailableMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('deve lançar erro se ticket já estiver vendido ou reservado', async () => {
    findAllMock.mockResolvedValue([{ id: 1, status: TicketStatus.available, price: 100 }] as never)
    sellIfAvailableMock.mockRejectedValue(new Error('Ticket 1 is not available'))

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1]
      })
    ).rejects.toThrow('Ticket 1 is not available')

    expect(createPurchaseMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('deve fazer rollback se ocorrer erro de banco', async () => {
    findAllMock.mockRejectedValue(new Error('DB error'))

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1]
      })
    ).rejects.toThrow('DB error')

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  it('deve impedir compra simultânea quando sellIfAvailable falhar na segunda tentativa', async () => {
    findAllMock.mockResolvedValue([
      { id: 1, status: TicketStatus.available, price: 100 },
      { id: 2, status: TicketStatus.available, price: 100 }
    ] as never)

    sellIfAvailableMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Ticket 2 is not available'))

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1, 2]
      })
    ).rejects.toThrow('Ticket 2 is not available')

    expect(sellIfAvailableMock).toHaveBeenCalledTimes(2)
    expect(createPurchaseMock).not.toHaveBeenCalled()
    expect(createPurchaseTicketMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('deve fazer rollback se audit log falhar', async () => {
    createAuditLogMock.mockRejectedValue(new Error('Audit log failed'))

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1, 2]
      })
    ).rejects.toThrow('Audit log failed')

    expect(createAuditLogMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })
})
