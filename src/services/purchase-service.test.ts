import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  findCustomerByIdMock,
  findTicketsMock,
  reserveIfAvailableMock,
  markAsSoldMock,
  markAsAvailableMock,
  createPurchaseMock,
  createManyPurchaseTicketsMock,
  createReservationMock,
  findReservationsMock,
  findPurchaseByIdMock,
  findPurchaseTicketsMock,
  getConnectionMock,
  beginTransactionMock,
  commitMock,
  rollbackMock,
  releaseMock
} = vi.hoisted(() => {
  return {
    findCustomerByIdMock: vi.fn(),
    findTicketsMock: vi.fn(),
    reserveIfAvailableMock: vi.fn(),
    markAsSoldMock: vi.fn(),
    markAsAvailableMock: vi.fn(),
    createPurchaseMock: vi.fn(),
    createManyPurchaseTicketsMock: vi.fn(),
    createReservationMock: vi.fn(),
    findReservationsMock: vi.fn(),
    findPurchaseByIdMock: vi.fn(),
    findPurchaseTicketsMock: vi.fn(),
    getConnectionMock: vi.fn(),
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    releaseMock: vi.fn()
  }
})

vi.mock('../models/customer-model', () => {
  return {
    CustomerModel: {
      findById: findCustomerByIdMock
    }
  }
})

vi.mock('../models/ticket-model', () => {
  return {
    TicketModel: {
      findAll: findTicketsMock,
      reserveIfAvailable: reserveIfAvailableMock,
      markAsSold: markAsSoldMock,
      markAsAvailable: markAsAvailableMock
    },
    TicketStatus: {
      available: 'available',
      sold: 'sold',
      reserved: 'reserved'
    }
  }
})

vi.mock('../models/purchase-model', () => {
  return {
    PurchaseModel: {
      create: createPurchaseMock,
      findById: findPurchaseByIdMock
    },
    PurchaseStatus: {
      pending: 'pending',
      paid: 'paid',
      error: 'error',
      cancelled: 'cancelled'
    }
  }
})

vi.mock('../models/purchase-ticket-model', () => {
  return {
    PurchaseTicketModel: {
      createMany: createManyPurchaseTicketsMock,
      findAll: findPurchaseTicketsMock
    }
  }
})

vi.mock('../models/reservation-ticket-model', () => {
  return {
    ReservationTicketModel: {
      create: createReservationMock,
      findAll: findReservationsMock
    },
    ReservationStatus: {
      reserved: 'reserved',
      cancelled: 'cancelled'
    }
  }
})

vi.mock('../database', () => {
  return {
    Database: {
      getInstance: vi.fn(() => ({
        getConnection: getConnectionMock
      }))
    }
  }
})

import { PurchaseStatus } from '../models/purchase-model.js'
import { ReservationStatus } from '../models/reservation-ticket-model.js'
import { TicketStatus } from '../models/ticket-model.js'
import { PurchaseService } from './purchase-service.js'

describe('PurchaseService', () => {
  let paymentService: {
    processPayment: ReturnType<typeof vi.fn>
  }

  const connection = {
    beginTransaction: beginTransactionMock,
    commit: commitMock,
    rollback: rollbackMock,
    release: releaseMock
  }

  beforeEach(() => {
    vi.clearAllMocks()

    paymentService = {
      processPayment: vi.fn()
    }

    getConnectionMock.mockResolvedValue(connection)
    reserveIfAvailableMock.mockResolvedValue(undefined)
    markAsSoldMock.mockResolvedValue(undefined)
    markAsAvailableMock.mockResolvedValue(undefined)
  })

  describe('create', () => {
    test('deve criar compra com sucesso', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const customer = {
        id: 1,
        address: 'Rua A',
        phone: '11999999999',
        user: {
          name: 'Viviane',
          email: 'viviane@email.com'
        }
      }

      const tickets = [
        {
          id: 10,
          price: 100,
          status: TicketStatus.available
        },
        {
          id: 11,
          price: 150,
          status: TicketStatus.available
        }
      ]

      const purchase = {
        id: 99,
        customer_id: 1,
        total_amount: 250,
        status: PurchaseStatus.pending,
        update: vi.fn()
      }

      findCustomerByIdMock.mockResolvedValue(customer)
      findTicketsMock.mockResolvedValue(tickets)
      createPurchaseMock.mockResolvedValue(purchase)
      createManyPurchaseTicketsMock.mockResolvedValue([])
      createReservationMock.mockResolvedValue({})
      paymentService.processPayment.mockResolvedValue(0.9)

      const result = await purchaseService.create({
        customerId: 1,
        ticketIds: [10, 11],
        cardToken: 'valid_token_123'
      })

      expect(findCustomerByIdMock).toHaveBeenCalledWith(1, { user: true })

      expect(findTicketsMock).toHaveBeenCalledWith(
        {
          where: { ids: [10, 11] }
        },
        { connection }
      )

      expect(reserveIfAvailableMock).toHaveBeenCalledTimes(2)
      expect(reserveIfAvailableMock).toHaveBeenNthCalledWith(1, 10, { connection })
      expect(reserveIfAvailableMock).toHaveBeenNthCalledWith(2, 11, { connection })

      expect(createPurchaseMock).toHaveBeenCalledWith(
        {
          customer_id: 1,
          total_amount: 250,
          status: PurchaseStatus.pending
        },
        { connection }
      )

      expect(createManyPurchaseTicketsMock).toHaveBeenCalledWith(
        [
          { purchase_id: 99, ticket_id: 10 },
          { purchase_id: 99, ticket_id: 11 }
        ],
        { connection }
      )

      expect(createReservationMock).toHaveBeenCalledTimes(2)
      expect(createReservationMock).toHaveBeenNthCalledWith(
        1,
        {
          customer_id: 1,
          ticket_id: 10,
          status: ReservationStatus.reserved
        },
        { connection }
      )
      expect(createReservationMock).toHaveBeenNthCalledWith(
        2,
        {
          customer_id: 1,
          ticket_id: 11,
          status: ReservationStatus.reserved
        },
        { connection }
      )

      expect(paymentService.processPayment).toHaveBeenCalledWith(
        {
          name: 'Viviane',
          email: 'viviane@email.com',
          address: 'Rua A',
          phone: '11999999999'
        },
        250,
        'valid_token_123'
      )

      expect(markAsSoldMock).toHaveBeenCalledTimes(2)
      expect(markAsSoldMock).toHaveBeenNthCalledWith(1, 10, { connection })
      expect(markAsSoldMock).toHaveBeenNthCalledWith(2, 11, { connection })

      expect(purchase.status).toBe(PurchaseStatus.paid)
      expect(purchase.update).toHaveBeenCalledWith({ connection })

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)
      expect(commitMock).toHaveBeenCalledTimes(1)
      expect(rollbackMock).not.toHaveBeenCalled()
      expect(releaseMock).toHaveBeenCalledTimes(1)

      expect(result).toBe(99)
    })

    test('deve lançar erro se customer não for encontrado', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      findCustomerByIdMock.mockResolvedValue(null)

      await expect(
        purchaseService.create({
          customerId: 1,
          ticketIds: [10, 11],
          cardToken: 'valid_token_123'
        })
      ).rejects.toThrow('Customer not found')

      expect(findCustomerByIdMock).toHaveBeenCalledWith(1, { user: true })
      expect(findTicketsMock).not.toHaveBeenCalled()
      expect(createPurchaseMock).not.toHaveBeenCalled()
      expect(paymentService.processPayment).not.toHaveBeenCalled()
      expect(getConnectionMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro se alguns tickets não forem encontrados', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const customer = {
        id: 1,
        address: 'Rua A',
        phone: '11999999999',
        user: {
          name: 'Viviane',
          email: 'viviane@email.com'
        }
      }

      findCustomerByIdMock.mockResolvedValue(customer)
      findTicketsMock.mockResolvedValue([
        {
          id: 10,
          price: 100,
          status: TicketStatus.available
        }
      ])

      await expect(
        purchaseService.create({
          customerId: 1,
          ticketIds: [10, 11],
          cardToken: 'valid_token_123'
        })
      ).rejects.toThrow('Some tickets not found')

      expect(findTicketsMock).toHaveBeenCalledWith(
        {
          where: { ids: [10, 11] }
        },
        { connection }
      )
      expect(createPurchaseMock).not.toHaveBeenCalled()
      expect(paymentService.processPayment).not.toHaveBeenCalled()
      expect(getConnectionMock).toHaveBeenCalledTimes(1)
      expect(beginTransactionMock).toHaveBeenCalledTimes(1)
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(releaseMock).toHaveBeenCalledTimes(1)
    })

    test('deve lançar erro se alguns tickets não estiverem disponíveis', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const customer = {
        id: 1,
        address: 'Rua A',
        phone: '11999999999',
        user: {
          name: 'Viviane',
          email: 'viviane@email.com'
        }
      }

      const tickets = [
        {
          id: 10,
          price: 100,
          status: TicketStatus.available
        },
        {
          id: 11,
          price: 150,
          status: TicketStatus.sold
        }
      ]

      findCustomerByIdMock.mockResolvedValue(customer)
      findTicketsMock.mockResolvedValue(tickets)
      reserveIfAvailableMock.mockRejectedValueOnce(new Error('Some tickets are not available'))

      await expect(
        purchaseService.create({
          customerId: 1,
          ticketIds: [10, 11],
          cardToken: 'valid_token_123'
        })
      ).rejects.toThrow('Some tickets are not available')

      expect(findTicketsMock).toHaveBeenCalledWith(
        {
          where: { ids: [10, 11] }
        },
        { connection }
      )
      expect(createPurchaseMock).not.toHaveBeenCalled()
      expect(paymentService.processPayment).not.toHaveBeenCalled()
      expect(getConnectionMock).toHaveBeenCalledTimes(1)
      expect(beginTransactionMock).toHaveBeenCalledTimes(1)
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(releaseMock).toHaveBeenCalledTimes(1)
    })

    test('deve fazer rollback se payment falhar', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const customer = {
        id: 1,
        address: 'Rua A',
        phone: '11999999999',
        user: {
          name: 'Viviane',
          email: 'viviane@email.com'
        }
      }

      const tickets = [
        {
          id: 10,
          price: 100,
          status: TicketStatus.available
        },
        {
          id: 11,
          price: 150,
          status: TicketStatus.available
        }
      ]

      const purchase = {
        id: 99,
        customer_id: 1,
        total_amount: 250,
        status: PurchaseStatus.pending,
        update: vi.fn()
      }

      findCustomerByIdMock.mockResolvedValue(customer)
      findTicketsMock.mockResolvedValue(tickets)
      createPurchaseMock.mockResolvedValue(purchase)
      createManyPurchaseTicketsMock.mockResolvedValue([])
      createReservationMock.mockResolvedValue({})
      paymentService.processPayment.mockRejectedValue(new Error('Payment failed'))

      await expect(
        purchaseService.create({
          customerId: 1,
          ticketIds: [10, 11],
          cardToken: 'valid_token_123'
        })
      ).rejects.toThrow('Payment failed')

      expect(findTicketsMock).toHaveBeenCalledWith(
        {
          where: { ids: [10, 11] }
        },
        { connection }
      )
      expect(reserveIfAvailableMock).toHaveBeenCalledTimes(2)
      expect(createReservationMock).toHaveBeenCalledTimes(2)
      expect(markAsSoldMock).not.toHaveBeenCalled()

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)
      expect(commitMock).not.toHaveBeenCalled()
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(releaseMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('cancel', () => {
    test('deve cancelar compra com sucesso', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const purchase = {
        id: 99,
        customer_id: 1,
        total_amount: 250,
        status: PurchaseStatus.paid,
        update: vi.fn()
      }

      const purchaseTickets = [
        { id: 1, purchase_id: 99, ticket_id: 10 },
        { id: 2, purchase_id: 99, ticket_id: 11 }
      ]

      const reservations = [
        {
          id: 1,
          customer_id: 1,
          ticket_id: 10,
          status: ReservationStatus.reserved,
          update: vi.fn()
        }
      ]

      findPurchaseByIdMock.mockResolvedValue(purchase)
      findPurchaseTicketsMock.mockResolvedValue(purchaseTickets)
      findReservationsMock.mockResolvedValue(reservations)

      await purchaseService.cancel(99)

      expect(findPurchaseByIdMock).toHaveBeenCalledWith(99)
      expect(findPurchaseTicketsMock).toHaveBeenCalledWith({
        where: { purchase_id: 99 }
      })
      expect(findReservationsMock).toHaveBeenCalledWith({
        where: {
          customer_id: 1,
          ticket_id: [10, 11],
          status: ReservationStatus.reserved
        }
      })

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)
      expect(commitMock).toHaveBeenCalledTimes(1)
      expect(rollbackMock).not.toHaveBeenCalled()
      expect(releaseMock).toHaveBeenCalledTimes(1)

      expect(markAsAvailableMock).toHaveBeenCalledTimes(2)
      expect(markAsAvailableMock).toHaveBeenNthCalledWith(1, 10, { connection })
      expect(markAsAvailableMock).toHaveBeenNthCalledWith(2, 11, { connection })

      expect(reservations[0].status).toBe(ReservationStatus.cancelled)
      expect(reservations[0].update).toHaveBeenCalledWith({ connection })

      expect(purchase.status).toBe(PurchaseStatus.cancelled)
      expect(purchase.update).toHaveBeenCalledWith({ connection })
    })

    test('deve lançar erro se purchase não for encontrada', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      findPurchaseByIdMock.mockResolvedValue(null)

      await expect(purchaseService.cancel(99)).rejects.toThrow('Purchase not found')

      expect(findPurchaseByIdMock).toHaveBeenCalledWith(99)
      expect(findPurchaseTicketsMock).not.toHaveBeenCalled()
      expect(findReservationsMock).not.toHaveBeenCalled()
      expect(getConnectionMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro se purchase já estiver cancelada', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const purchase = {
        id: 99,
        customer_id: 1,
        total_amount: 250,
        status: PurchaseStatus.cancelled,
        update: vi.fn()
      }

      findPurchaseByIdMock.mockResolvedValue(purchase)

      await expect(purchaseService.cancel(99)).rejects.toThrow('Purchase already cancelled')

      expect(findPurchaseByIdMock).toHaveBeenCalledWith(99)
      expect(findPurchaseTicketsMock).not.toHaveBeenCalled()
      expect(findReservationsMock).not.toHaveBeenCalled()
      expect(getConnectionMock).not.toHaveBeenCalled()
    })

    test('deve fazer rollback se ocorrer erro no cancelamento', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const purchase = {
        id: 99,
        customer_id: 1,
        total_amount: 250,
        status: PurchaseStatus.paid,
        update: vi.fn()
      }

      const purchaseTickets = [{ id: 1, purchase_id: 99, ticket_id: 10 }]

      const reservations = [
        {
          id: 1,
          customer_id: 1,
          ticket_id: 10,
          status: ReservationStatus.reserved,
          update: vi.fn()
        }
      ]

      findPurchaseByIdMock.mockResolvedValue(purchase)
      findPurchaseTicketsMock.mockResolvedValue(purchaseTickets)
      findReservationsMock.mockResolvedValue(reservations)
      markAsAvailableMock.mockRejectedValueOnce(new Error('Ticket update failed'))

      await expect(purchaseService.cancel(99)).rejects.toThrow('Ticket update failed')

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)
      expect(commitMock).not.toHaveBeenCalled()
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(releaseMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('findById', () => {
    test('deve buscar compra por id', async () => {
      const purchaseService = new PurchaseService(paymentService as never)

      const purchase = {
        id: 1,
        customer_id: 1,
        total_amount: 200,
        status: PurchaseStatus.paid
      }

      findPurchaseByIdMock.mockResolvedValue(purchase)

      const result = await purchaseService.findById(1)

      expect(findPurchaseByIdMock).toHaveBeenCalledWith(1)
      expect(result).toEqual(purchase)
    })
  })
})
