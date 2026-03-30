import { beforeEach, describe, expect, test, vi } from 'vitest'

const { executeMock, getInstanceMock } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
    getInstanceMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: getInstanceMock
    }
  }
})

import { PoolConnection } from 'mysql2/promise'

import { ReservationStatus, ReservationTicketModel } from './reservation-ticket-model.js'

describe('ReservationTicketModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar uma reservation com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await ReservationTicketModel.create({
        customer_id: 10,
        ticket_id: 20,
        status: ReservationStatus.reserved
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO reservation_tickets (customer_id, ticket_id, status, reservation_date) VALUES (?, ?, ?, ?)',
        [10, 20, ReservationStatus.reserved, expect.any(Date)]
      )

      expect(result).toBeInstanceOf(ReservationTicketModel)
      expect(result.id).toBe(1)
      expect(result.customer_id).toBe(10)
      expect(result.ticket_id).toBe(20)
      expect(result.status).toBe(ReservationStatus.reserved)
      expect(result.reservation_date).toBeInstanceOf(Date)
    })

    test('deve criar uma reservation com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await ReservationTicketModel.create(
        {
          customer_id: 30,
          ticket_id: 40,
          status: ReservationStatus.cancelled
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO reservation_tickets (customer_id, ticket_id, status, reservation_date) VALUES (?, ?, ?, ?)',
        [30, 40, ReservationStatus.cancelled, expect.any(Date)]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(ReservationTicketModel)
      expect(result.id).toBe(2)
      expect(result.customer_id).toBe(30)
      expect(result.ticket_id).toBe(40)
      expect(result.status).toBe(ReservationStatus.cancelled)
      expect(result.reservation_date).toBeInstanceOf(Date)
    })
  })

  describe('findById', () => {
    test('deve retornar uma reservation quando encontrada', async () => {
      const row = {
        id: 1,
        customer_id: 10,
        ticket_id: 20,
        reservation_date: new Date('2026-03-30T17:00:00.000Z'),
        status: ReservationStatus.reserved
      }

      executeMock.mockResolvedValue([[row]])

      const result = await ReservationTicketModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE id = ?',
        [1]
      )

      expect(result).toBeInstanceOf(ReservationTicketModel)
      expect(result?.id).toBe(1)
      expect(result?.customer_id).toBe(10)
      expect(result?.ticket_id).toBe(20)
      expect(result?.status).toBe(ReservationStatus.reserved)
      expect(result?.reservation_date).toEqual(new Date('2026-03-30T17:00:00.000Z'))
    })

    test('deve retornar null quando não encontrar reservation', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await ReservationTicketModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE id = ?',
        [999]
      )

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    test('deve retornar todas as reservations sem filtro', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          ticket_id: 20,
          reservation_date: new Date('2026-03-30T17:00:00.000Z'),
          status: ReservationStatus.reserved
        },
        {
          id: 2,
          customer_id: 11,
          ticket_id: 21,
          reservation_date: new Date('2026-03-30T18:00:00.000Z'),
          status: ReservationStatus.cancelled
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await ReservationTicketModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM reservation_tickets', [])

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(ReservationTicketModel)
      expect(result[1]).toBeInstanceOf(ReservationTicketModel)
    })

    test('deve retornar reservations filtrando por customer_id', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          ticket_id: 20,
          reservation_date: new Date(),
          status: ReservationStatus.reserved
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await ReservationTicketModel.findAll({
        where: { customer_id: 10 }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE customer_id = ?',
        [10]
      )

      expect(result).toHaveLength(1)
    })

    test('deve retornar reservations filtrando por ticket_id', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          ticket_id: 20,
          reservation_date: new Date(),
          status: ReservationStatus.reserved
        },
        {
          id: 2,
          customer_id: 10,
          ticket_id: 21,
          reservation_date: new Date(),
          status: ReservationStatus.reserved
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await ReservationTicketModel.findAll({
        where: { ticket_id: [20, 21] }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE ticket_id IN (?, ?)',
        [20, 21]
      )

      expect(result).toHaveLength(2)
    })

    test('deve retornar reservations filtrando por status', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          ticket_id: 20,
          reservation_date: new Date(),
          status: ReservationStatus.reserved
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await ReservationTicketModel.findAll({
        where: { status: ReservationStatus.reserved }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE status = ?',
        [ReservationStatus.reserved]
      )

      expect(result).toHaveLength(1)
    })

    test('deve retornar reservations filtrando por reserved_before', async () => {
      const reservedBefore = new Date('2026-03-30T18:00:00.000Z')
      const rows = [
        {
          id: 1,
          customer_id: 10,
          ticket_id: 20,
          reservation_date: new Date('2026-03-30T17:00:00.000Z'),
          status: ReservationStatus.reserved
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await ReservationTicketModel.findAll({
        where: { reserved_before: reservedBefore }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE reservation_date < ?',
        [reservedBefore]
      )

      expect(result).toHaveLength(1)
    })

    test('deve retornar reservations filtrando por customer_id, ticket_id, status e reserved_before', async () => {
      const reservedBefore = new Date('2026-03-30T18:00:00.000Z')
      const rows = [
        {
          id: 1,
          customer_id: 10,
          ticket_id: 20,
          reservation_date: new Date('2026-03-30T17:00:00.000Z'),
          status: ReservationStatus.reserved
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await ReservationTicketModel.findAll({
        where: {
          customer_id: 10,
          ticket_id: [20, 21],
          status: ReservationStatus.reserved,
          reserved_before: reservedBefore
        }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE customer_id = ? AND ticket_id IN (?, ?) AND status = ? AND reservation_date < ?',
        [10, 20, 21, ReservationStatus.reserved, reservedBefore]
      )

      expect(result).toHaveLength(1)
    })
  })

  describe('update', () => {
    test('deve atualizar uma reservation com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const reservation = new ReservationTicketModel({
        id: 1,
        customer_id: 99,
        ticket_id: 88,
        status: ReservationStatus.cancelled
      })

      await reservation.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE reservation_tickets SET customer_id = ?, ticket_id = ?, status = ? WHERE id = ?',
        [99, 88, ReservationStatus.cancelled, 1]
      )
    })

    test('deve lançar erro ao tentar atualizar reservation inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const reservation = new ReservationTicketModel({
        id: 999,
        customer_id: 99,
        ticket_id: 88,
        status: ReservationStatus.cancelled
      })

      await expect(reservation.update()).rejects.toThrow('Reservation not found')
    })
  })

  describe('delete', () => {
    test('deve deletar uma reservation com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const reservation = new ReservationTicketModel({
        id: 1
      })

      await reservation.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM reservation_tickets WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar reservation inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const reservation = new ReservationTicketModel({
        id: 999
      })

      await expect(reservation.delete()).rejects.toThrow('Reservation not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const reservation = new ReservationTicketModel()
      const reservationDate = new Date('2026-03-30T17:00:00.000Z')

      reservation.fill({
        id: 1,
        customer_id: 10,
        ticket_id: 20,
        reservation_date: reservationDate,
        status: ReservationStatus.reserved
      })

      expect(reservation.id).toBe(1)
      expect(reservation.customer_id).toBe(10)
      expect(reservation.ticket_id).toBe(20)
      expect(reservation.reservation_date).toBe(reservationDate)
      expect(reservation.status).toBe(ReservationStatus.reserved)
    })
  })
})
