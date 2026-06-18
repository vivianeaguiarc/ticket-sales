import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByUserIdMock } = vi.hoisted(() => {
  return {
    findByUserIdMock: vi.fn()
  }
})

const { findPurchasesByCustomerMock, findReservationsByCustomerMock } = vi.hoisted(() => {
  return {
    findPurchasesByCustomerMock: vi.fn(),
    findReservationsByCustomerMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getSharedCustomerRepository: () => ({
      findByUserId: findByUserIdMock
    })
  }
})

vi.mock('../models/purchase-model.js', () => {
  return {
    PurchaseModel: {
      findByCustomerIdWithTicketsAndEvents: findPurchasesByCustomerMock
    }
  }
})

vi.mock('../models/reservation-ticket-model.js', () => {
  return {
    ReservationTicketModel: {
      findByCustomerIdWithTicketAndEvent: findReservationsByCustomerMock
    }
  }
})

import { Customer } from '../domain/entities/customer.js'
import { CustomerService } from './customer-service.js'

describe('CustomerService', () => {
  const customerService = new CustomerService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findByUserId', () => {
    test('deve buscar customer por userId', async () => {
      const createdAt = new Date()
      const domainCustomer = new Customer(5, 2, 'Rua A', '111', createdAt)

      findByUserIdMock.mockResolvedValue(domainCustomer)

      const result = await customerService.findByUserId(2)

      expect(findByUserIdMock).toHaveBeenCalledWith(2)
      expect(result).toMatchObject({
        id: 5,
        user_id: 2
      })
    })
  })

  describe('listPurchasesByAuthenticatedCustomer', () => {
    test('deve listar purchases do customer autenticado', async () => {
      const createdAt = new Date()
      const domainCustomer = new Customer(5, 10, 'Rua A', '111', createdAt)
      const purchases = [
        { id: 1, status: 'paid', total_amount: 200, purchase_date: new Date(), tickets: [] }
      ]

      findByUserIdMock.mockResolvedValue(domainCustomer)
      findPurchasesByCustomerMock.mockResolvedValue(purchases)

      const result = await customerService.listPurchasesByAuthenticatedCustomer(10)

      expect(findByUserIdMock).toHaveBeenCalledWith(10)
      expect(findPurchasesByCustomerMock).toHaveBeenCalledWith(5)
      expect(result).toEqual(purchases)
    })

    test('deve lançar CustomerNotFoundError se usuário não for customer', async () => {
      findByUserIdMock.mockResolvedValue(null)

      await expect(customerService.listPurchasesByAuthenticatedCustomer(99)).rejects.toThrow(
        'Customer not found'
      )
      expect(findPurchasesByCustomerMock).not.toHaveBeenCalled()
    })

    test('deve filtrar por customer_id do usuário autenticado e não expor outro customer', async () => {
      const createdAt = new Date()
      const domainCustomer = new Customer(5, 10, 'Rua A', '111', createdAt)

      findByUserIdMock.mockResolvedValue(domainCustomer)
      findPurchasesByCustomerMock.mockResolvedValue([])

      await customerService.listPurchasesByAuthenticatedCustomer(10)

      expect(findPurchasesByCustomerMock).toHaveBeenCalledWith(5)
      expect(findPurchasesByCustomerMock).not.toHaveBeenCalledWith(99)
    })
  })

  describe('listReservationsByAuthenticatedCustomer', () => {
    test('deve listar reservations do customer autenticado', async () => {
      const createdAt = new Date()
      const domainCustomer = new Customer(5, 10, 'Rua A', '111', createdAt)
      const reservations = [
        {
          id: 1,
          status: 'reserved',
          reservation_date: new Date(),
          expires_at: new Date(),
          ticket: {
            id: 1,
            location: 'A1',
            price: 100,
            status: 'reserved',
            event: { id: 1, name: 'X', date: new Date(), location: 'SP' }
          }
        }
      ]

      findByUserIdMock.mockResolvedValue(domainCustomer)
      findReservationsByCustomerMock.mockResolvedValue(reservations)

      const result = await customerService.listReservationsByAuthenticatedCustomer(10)

      expect(findByUserIdMock).toHaveBeenCalledWith(10)
      expect(findReservationsByCustomerMock).toHaveBeenCalledWith(5)
      expect(result).toEqual(reservations)
    })

    test('deve lançar CustomerNotFoundError se usuário não for customer', async () => {
      findByUserIdMock.mockResolvedValue(null)

      await expect(customerService.listReservationsByAuthenticatedCustomer(99)).rejects.toThrow(
        'Customer not found'
      )
      expect(findReservationsByCustomerMock).not.toHaveBeenCalled()
    })

    test('deve retornar lista vazia se não houver reservas', async () => {
      const createdAt = new Date()
      const domainCustomer = new Customer(5, 10, 'Rua A', '111', createdAt)

      findByUserIdMock.mockResolvedValue(domainCustomer)
      findReservationsByCustomerMock.mockResolvedValue([])

      const result = await customerService.listReservationsByAuthenticatedCustomer(10)

      expect(result).toEqual([])
    })
  })
})
