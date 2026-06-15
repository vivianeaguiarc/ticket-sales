import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Database } from '../database.js'
import { PurchaseModel, PurchaseStatus } from '../models/purchase-model.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'
import { CancelPurchaseUseCase } from './cancel-purchase-use-case.js'

describe('CancelPurchaseUseCase', () => {
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

  const findPurchaseByIdMock = vi.spyOn(PurchaseModel, 'findById')
  const findPurchaseTicketsMock = vi.spyOn(PurchaseTicketModel, 'findAll')
  const releaseIfSoldMock = vi.spyOn(TicketModel, 'releaseIfSold')
  const createHistoryMock = vi.spyOn(TicketStatusHistoryModel, 'create')
  const findReservationsMock = vi.spyOn(ReservationTicketModel, 'findAll')
  const markAsCancelledMock = vi.spyOn(ReservationTicketModel, 'markAsCancelled')

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

    releaseIfSoldMock.mockResolvedValue(true)
    createHistoryMock.mockResolvedValue({} as never)
    markAsCancelledMock.mockResolvedValue(undefined)
  })

  test('deve cancelar uma compra com sucesso', async () => {
    const purchase = new PurchaseModel({
      id: 10,
      customer_id: 1,
      total_amount: 200,
      status: PurchaseStatus.paid
    })

    purchase.update = vi.fn().mockResolvedValue(undefined)

    findPurchaseByIdMock.mockResolvedValue(purchase)
    findPurchaseTicketsMock.mockResolvedValue([
      { id: 1, purchase_id: 10, ticket_id: 101 },
      { id: 2, purchase_id: 10, ticket_id: 102 }
    ] as never)
    findReservationsMock.mockResolvedValue([
      { id: 5, customer_id: 1, ticket_id: 101, status: ReservationStatus.reserved }
    ] as never)

    await CancelPurchaseUseCase.execute({ purchase_id: 10 })

    expect(findPurchaseByIdMock).toHaveBeenCalledWith(10, {
      connection,
      forUpdate: true
    })
    expect(findPurchaseTicketsMock).toHaveBeenCalledWith(
      { where: { purchase_id: 10 } },
      { connection }
    )
    expect(releaseIfSoldMock).toHaveBeenCalledTimes(2)
    expect(createHistoryMock).toHaveBeenCalledTimes(2)
    expect(findReservationsMock).toHaveBeenCalledWith(
      {
        where: {
          customer_id: 1,
          ticket_id: [101, 102],
          status: ReservationStatus.reserved
        }
      },
      { connection }
    )
    expect(markAsCancelledMock).toHaveBeenCalledWith(5, { connection })
    expect(purchase.status).toBe(PurchaseStatus.cancelled)
    expect(purchase.update).toHaveBeenCalledWith({ connection })
    expect(commitMock).toHaveBeenCalled()
    expect(rollbackMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve lançar erro se purchase_id não for informado', async () => {
    await expect(CancelPurchaseUseCase.execute({ purchase_id: 0 })).rejects.toThrow(
      'Purchase id is required'
    )
  })

  test('deve lançar erro se purchase não for encontrada', async () => {
    findPurchaseByIdMock.mockResolvedValue(null)

    await expect(CancelPurchaseUseCase.execute({ purchase_id: 10 })).rejects.toThrow(
      'Purchase not found'
    )

    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve lançar erro se purchase já estiver cancelada', async () => {
    findPurchaseByIdMock.mockResolvedValue(
      new PurchaseModel({
        id: 10,
        customer_id: 1,
        status: PurchaseStatus.cancelled
      })
    )

    await expect(CancelPurchaseUseCase.execute({ purchase_id: 10 })).rejects.toThrow(
      'Purchase already cancelled'
    )

    expect(findPurchaseTicketsMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve lançar erro se não encontrar purchase tickets', async () => {
    findPurchaseByIdMock.mockResolvedValue(
      new PurchaseModel({
        id: 10,
        customer_id: 1,
        status: PurchaseStatus.paid
      })
    )
    findPurchaseTicketsMock.mockResolvedValue([])

    await expect(CancelPurchaseUseCase.execute({ purchase_id: 10 })).rejects.toThrow(
      'Purchase tickets not found'
    )

    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se releaseIfSold lançar erro', async () => {
    const purchase = new PurchaseModel({
      id: 10,
      customer_id: 1,
      status: PurchaseStatus.paid
    })

    findPurchaseByIdMock.mockResolvedValue(purchase)
    findPurchaseTicketsMock.mockResolvedValue([{ id: 1, purchase_id: 10, ticket_id: 101 }] as never)
    releaseIfSoldMock.mockRejectedValue(new Error('Ticket update failed'))

    await expect(CancelPurchaseUseCase.execute({ purchase_id: 10 })).rejects.toThrow(
      'Ticket update failed'
    )

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })
})
