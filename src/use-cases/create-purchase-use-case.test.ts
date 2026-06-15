import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Database } from '../database.js'
import { PurchaseModel } from '../models/purchase-model.js'
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

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)

    getConnectionMock.mockResolvedValue(connection)

    vi.spyOn(Database, 'getInstance').mockReturnValue({
      getConnection: getConnectionMock
    } as unknown as ReturnType<typeof Database.getInstance>)
  })

  it('deve criar compra com sucesso', async () => {
    vi.spyOn(TicketModel, 'findAll').mockResolvedValue([
      { id: 1, status: TicketStatus.available, price: 100 },
      { id: 2, status: TicketStatus.available, price: 100 }
    ] as never)

    vi.spyOn(PurchaseModel, 'create').mockResolvedValue({ id: 10 } as never)

    const sellIfAvailableSpy = vi.spyOn(TicketModel, 'sellIfAvailable').mockResolvedValue(undefined)

    const historySpy = vi
      .spyOn(TicketStatusHistoryModel, 'create')
      .mockResolvedValue(undefined as never)

    const purchaseTicketSpy = vi
      .spyOn(PurchaseTicketModel, 'create')
      .mockResolvedValue(undefined as never)

    const result = await CreatePurchaseUseCase.execute({
      customer_id: 1,
      ticket_ids: [1, 2]
    })

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(commitMock).toHaveBeenCalled()
    expect(result.id).toBe(10)

    expect(purchaseTicketSpy).toHaveBeenCalledTimes(2)
    expect(sellIfAvailableSpy).toHaveBeenCalledTimes(2)
    expect(historySpy).toHaveBeenCalledTimes(2)
    expect(sellIfAvailableSpy).toHaveBeenNthCalledWith(1, 1, { connection })
    expect(sellIfAvailableSpy).toHaveBeenNthCalledWith(2, 2, { connection })
  })

  it('deve lançar erro se ticket_ids estiver vazio', async () => {
    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        ticket_ids: []
      })
    ).rejects.toThrow('ticket_ids is required')
  })

  it('deve lançar erro se ticket não for encontrado', async () => {
    vi.spyOn(TicketModel, 'findAll').mockResolvedValue([
      { id: 1, status: TicketStatus.available, price: 100 }
    ] as never)

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        ticket_ids: [1, 2]
      })
    ).rejects.toThrow('Some tickets not found')

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('deve lançar erro se ticket não estiver disponível', async () => {
    vi.spyOn(TicketModel, 'findAll').mockResolvedValue([
      { id: 1, status: TicketStatus.available, price: 100 }
    ] as never)

    vi.spyOn(PurchaseModel, 'create').mockResolvedValue({ id: 10 } as never)
    vi.spyOn(PurchaseTicketModel, 'create').mockResolvedValue(undefined as never)
    vi.spyOn(TicketModel, 'sellIfAvailable').mockRejectedValue(
      new Error('Ticket 1 is not available')
    )

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        ticket_ids: [1]
      })
    ).rejects.toThrow('Ticket 1 is not available')

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('deve fazer rollback se ocorrer erro de banco', async () => {
    vi.spyOn(TicketModel, 'findAll').mockRejectedValue(new Error('DB error'))

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        ticket_ids: [1]
      })
    ).rejects.toThrow('DB error')

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })
})
