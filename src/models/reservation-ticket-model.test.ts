import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Database } from '../database.js'
import { ReservationStatus, ReservationTicketModel } from './reservation-ticket-model.js'

describe('ReservationTicketModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('create', () => {
    it('deve criar uma reservation com sucesso usando Database.getInstance()', async () => {
      const executeMock = vi.fn().mockResolvedValue([{ insertId: 1 }])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservation = await ReservationTicketModel.create({
        customer_id: 1,
        ticket_id: 2,
        status: ReservationStatus.reserved
      })

      expect(executeMock).toHaveBeenCalledTimes(1)
      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO reservation_tickets (customer_id, ticket_id, status, reservation_date, expires_at) VALUES (?, ?, ?, ?, ?)',
        [1, 2, ReservationStatus.reserved, expect.any(Date), expect.any(Date)]
      )

      expect(reservation).toBeInstanceOf(ReservationTicketModel)
      expect(reservation.id).toBe(1)
      expect(reservation.customer_id).toBe(1)
      expect(reservation.ticket_id).toBe(2)
      expect(reservation.status).toBe(ReservationStatus.reserved)
      expect(reservation.reservation_date).toBeInstanceOf(Date)
      expect(reservation.expires_at).toBeInstanceOf(Date)
    })

    it('deve criar uma reservation com sucesso usando connection nas options', async () => {
      const executeMock = vi.fn().mockResolvedValue([{ insertId: 2 }])
      const connection = {
        execute: executeMock
      }

      const expires_at = new Date(Date.now() + 10 * 60 * 1000)

      const reservation = await ReservationTicketModel.create(
        {
          customer_id: 3,
          ticket_id: 4,
          status: ReservationStatus.reserved,
          expires_at
        },
        { connection: connection as never }
      )

      expect(executeMock).toHaveBeenCalledTimes(1)
      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO reservation_tickets (customer_id, ticket_id, status, reservation_date, expires_at) VALUES (?, ?, ?, ?, ?)',
        [3, 4, ReservationStatus.reserved, expect.any(Date), expires_at]
      )

      expect(reservation).toBeInstanceOf(ReservationTicketModel)
      expect(reservation.id).toBe(2)
      expect(reservation.customer_id).toBe(3)
      expect(reservation.ticket_id).toBe(4)
      expect(reservation.status).toBe(ReservationStatus.reserved)
      expect(reservation.expires_at).toEqual(expires_at)
    })
  })

  describe('findById', () => {
    it('deve retornar uma reservation quando encontrada', async () => {
      const reservationData = {
        id: 1,
        customer_id: 1,
        ticket_id: 2,
        reservation_date: new Date(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        status: ReservationStatus.reserved
      }

      const executeMock = vi.fn().mockResolvedValue([[reservationData]])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservation = await ReservationTicketModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE id = ?',
        [1]
      )
      expect(reservation).toBeInstanceOf(ReservationTicketModel)
      expect(reservation?.id).toBe(1)
      expect(reservation?.expires_at).toEqual(reservationData.expires_at)
    })

    it('deve retornar null quando não encontrar reservation', async () => {
      const executeMock = vi.fn().mockResolvedValue([[]])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservation = await ReservationTicketModel.findById(999)

      expect(reservation).toBeNull()
    })
  })

  describe('findAll', () => {
    it('deve retornar todas as reservations sem filtro', async () => {
      const reservationsData = [
        {
          id: 1,
          customer_id: 1,
          ticket_id: 2,
          reservation_date: new Date(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000),
          status: ReservationStatus.reserved
        },
        {
          id: 2,
          customer_id: 2,
          ticket_id: 3,
          reservation_date: new Date(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000),
          status: ReservationStatus.cancelled
        }
      ]

      const executeMock = vi.fn().mockResolvedValue([reservationsData])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservations = await ReservationTicketModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM reservation_tickets', [])
      expect(reservations).toHaveLength(2)
      expect(reservations[0]).toBeInstanceOf(ReservationTicketModel)
      expect(reservations[1]).toBeInstanceOf(ReservationTicketModel)
    })

    it('deve retornar reservations filtrando por expires_at', async () => {
      const expires_at = new Date()
      const reservationsData = [
        {
          id: 1,
          customer_id: 1,
          ticket_id: 2,
          reservation_date: new Date(),
          expires_at: new Date(Date.now() - 60 * 1000),
          status: ReservationStatus.reserved
        }
      ]

      const executeMock = vi.fn().mockResolvedValue([reservationsData])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservations = await ReservationTicketModel.findAll({
        where: {
          expires_at
        }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM reservation_tickets WHERE expires_at < ?',
        [expires_at]
      )
      expect(reservations).toHaveLength(1)
      expect(reservations[0]).toBeInstanceOf(ReservationTicketModel)
    })
  })

  describe('update', () => {
    it('deve atualizar uma reservation com sucesso', async () => {
      const executeMock = vi.fn().mockResolvedValue([{ affectedRows: 1 }])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservation = new ReservationTicketModel({
        id: 1,
        customer_id: 1,
        ticket_id: 2,
        status: ReservationStatus.cancelled,
        expires_at: new Date()
      })

      await reservation.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE reservation_tickets SET customer_id = ?, ticket_id = ?, status = ?, expires_at = ? WHERE id = ?',
        [
          reservation.customer_id,
          reservation.ticket_id,
          reservation.status,
          reservation.expires_at,
          reservation.id
        ]
      )
    })

    it('deve lançar erro ao tentar atualizar reservation inexistente', async () => {
      const executeMock = vi.fn().mockResolvedValue([{ affectedRows: 0 }])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservation = new ReservationTicketModel({
        id: 999,
        customer_id: 1,
        ticket_id: 2,
        status: ReservationStatus.cancelled,
        expires_at: new Date()
      })

      await expect(reservation.update()).rejects.toThrow('Reservation not found')
    })
  })

  describe('delete', () => {
    it('deve deletar uma reservation com sucesso', async () => {
      const executeMock = vi.fn().mockResolvedValue([{ affectedRows: 1 }])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservation = new ReservationTicketModel({
        id: 1
      })

      await reservation.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM reservation_tickets WHERE id = ?', [1])
    })

    it('deve lançar erro ao tentar deletar reservation inexistente', async () => {
      const executeMock = vi.fn().mockResolvedValue([{ affectedRows: 0 }])

      vi.spyOn(Database, 'getInstance').mockReturnValue({
        execute: executeMock
      } as unknown as ReturnType<typeof Database.getInstance>)

      const reservation = new ReservationTicketModel({
        id: 999
      })

      await expect(reservation.delete()).rejects.toThrow('Reservation not found')
    })
  })

  describe('fill', () => {
    it('deve preencher todos os campos informados', () => {
      const reservationDate = new Date()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

      const reservation = new ReservationTicketModel()

      reservation.fill({
        id: 1,
        customer_id: 2,
        ticket_id: 3,
        reservation_date: reservationDate,
        expires_at: expiresAt,
        status: ReservationStatus.reserved
      })

      expect(reservation.id).toBe(1)
      expect(reservation.customer_id).toBe(2)
      expect(reservation.ticket_id).toBe(3)
      expect(reservation.reservation_date).toBe(reservationDate)
      expect(reservation.expires_at).toBe(expiresAt)
      expect(reservation.status).toBe(ReservationStatus.reserved)
    })
  })
})
