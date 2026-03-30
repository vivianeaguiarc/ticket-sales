import { beforeEach, describe, expect, test, vi } from 'vitest'

const { executeMock, getInstanceMock } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
    getInstanceMock: vi.fn()
  }
})

vi.mock('../database', () => {
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
    test('deve criar uma reserva com sucesso usando Database.getInstance()', async () => {
      const reservationDate = new Date('2026-03-30T12:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(reservationDate)

      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await ReservationTicketModel.create({
        customer_id: 10,
        ticket_id: 20,
        status: ReservationStatus.reserved
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO reservation_tickets (customer_id, ticket_id, status, reservation_date) VALUES (?, ?, ?, ?)',
        [10, 20, ReservationStatus.reserved, reservationDate]
      )

      expect(result).toBeInstanceOf(ReservationTicketModel)
      expect(result.id).toBe(1)
      expect(result.customer_id).toBe(10)
      expect(result.ticket_id).toBe(20)
      expect(result.status).toBe(ReservationStatus.reserved)
      expect(result.reservation_date).toEqual(reservationDate)

      vi.useRealTimers()
    })

    test('deve criar uma reserva com sucesso usando connection nas options', async () => {
      const reservationDate = new Date('2026-03-30T13:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(reservationDate)

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
        [30, 40, ReservationStatus.cancelled, reservationDate]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(ReservationTicketModel)
      expect(result.id).toBe(2)
      expect(result.customer_id).toBe(30)
      expect(result.ticket_id).toBe(40)
      expect(result.status).toBe(ReservationStatus.cancelled)
      expect(result.reservation_date).toEqual(reservationDate)

      vi.useRealTimers()
    })
  })

  describe('findById', () => {
    test('deve retornar uma reserva quando encontrada', async () => {
      const row = {
        id: 1,
        customer_id: 10,
        ticket_id: 20,
        reservation_date: new Date('2026-03-30T12:00:00.000Z'),
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
    })

    test('deve retornar null quando não encontrar reserva', async () => {
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
    test('deve retornar todas as reservas', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          ticket_id: 20,
          reservation_date: new Date('2026-03-30T12:00:00.000Z'),
          status: ReservationStatus.reserved
        },
        {
          id: 2,
          customer_id: 11,
          ticket_id: 21,
          reservation_date: new Date('2026-03-30T13:00:00.000Z'),
          status: ReservationStatus.cancelled
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await ReservationTicketModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM reservation_tickets')
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(ReservationTicketModel)
      expect(result[1]).toBeInstanceOf(ReservationTicketModel)
      expect(result[0].status).toBe(ReservationStatus.reserved)
      expect(result[1].status).toBe(ReservationStatus.cancelled)
    })
  })

  describe('update', () => {
    test('deve atualizar uma reserva com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const reservation = new ReservationTicketModel({
        id: 1,
        customer_id: 10,
        ticket_id: 20,
        status: ReservationStatus.cancelled
      })

      await reservation.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE reservation_tickets SET customer_id = ?, ticket_id = ?, status = ? WHERE id = ?',
        [10, 20, ReservationStatus.cancelled, 1]
      )
    })

    test('deve atualizar uma reserva com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ affectedRows: 1 }])

      const reservation = new ReservationTicketModel({
        id: 2,
        customer_id: 30,
        ticket_id: 40,
        status: ReservationStatus.reserved
      })

      await reservation.update({
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'UPDATE reservation_tickets SET customer_id = ?, ticket_id = ?, status = ? WHERE id = ?',
        [30, 40, ReservationStatus.reserved, 2]
      )

      expect(executeMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro ao tentar atualizar reserva inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const reservation = new ReservationTicketModel({
        id: 999,
        customer_id: 10,
        ticket_id: 20,
        status: ReservationStatus.reserved
      })

      await expect(reservation.update()).rejects.toThrow('Reservation not found')
    })
  })

  describe('delete', () => {
    test('deve deletar uma reserva com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const reservation = new ReservationTicketModel({
        id: 1
      })

      await reservation.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM reservation_tickets WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar reserva inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const reservation = new ReservationTicketModel({
        id: 999
      })

      await expect(reservation.delete()).rejects.toThrow('Reservation not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const reservationDate = new Date('2026-03-30T12:00:00.000Z')

      const reservation = new ReservationTicketModel()

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
      expect(reservation.reservation_date).toEqual(reservationDate)
      expect(reservation.status).toBe(ReservationStatus.reserved)
    })

    test('deve preencher parcialmente sem sobrescrever campos não informados', () => {
      const reservationDate = new Date('2026-03-30T12:00:00.000Z')

      const reservation = new ReservationTicketModel({
        id: 1,
        customer_id: 10,
        ticket_id: 20,
        reservation_date: reservationDate,
        status: ReservationStatus.reserved
      })

      reservation.fill({
        status: ReservationStatus.cancelled
      })

      expect(reservation.id).toBe(1)
      expect(reservation.customer_id).toBe(10)
      expect(reservation.ticket_id).toBe(20)
      expect(reservation.reservation_date).toEqual(reservationDate)
      expect(reservation.status).toBe(ReservationStatus.cancelled)
    })
  })
})
