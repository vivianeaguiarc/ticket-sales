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

    const markAsSoldSpy = vi.spyOn(TicketModel, 'markAsSold').mockResolvedValue(undefined)

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

    expect(markAsSoldSpy).toHaveBeenCalledTimes(2)
    expect(historySpy).toHaveBeenCalledTimes(2)
    expect(purchaseTicketSpy).toHaveBeenCalledTimes(2)
  })

  it('deve lançar erro se ticket_ids estiver vazio', async () => {
    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        ticket_ids: []
      })
    ).rejects.toThrow('ticket_ids is required')
  })

  it('deve lançar erro se ticket não estiver disponível', async () => {
    vi.spyOn(TicketModel, 'findAll').mockResolvedValue([
      { id: 1, status: TicketStatus.sold, price: 100 }
    ] as never)

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        ticket_ids: [1]
      })
    ).rejects.toThrow('not available')
  })

  it('deve fazer rollback se ocorrer erro', async () => {
    vi.spyOn(TicketModel, 'findAll').mockRejectedValue(new Error('DB error'))

    await expect(
      CreatePurchaseUseCase.execute({
        customer_id: 1,
        ticket_ids: [1]
      })
    ).rejects.toThrow()

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })
})
