import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import {
  InvalidTicketStatusTransitionError,
  TicketNotFoundError,
  TicketUnavailableError
} from '../../domain/errors/ticket-errors.js'
import { TicketModel } from '../../models/ticket-model.js'
import { MysqlTicketRepository } from './mysql-ticket-repository.js'

describe('MysqlTicketRepository', () => {
  const repository = new MysqlTicketRepository()

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('deve mapear tickets do model para entidade de domínio em findByIds', async () => {
    vi.spyOn(TicketModel, 'findAll').mockResolvedValue([
      {
        id: 1,
        event_id: 10,
        location: 'A1',
        price: 50,
        status: TicketStatus.available,
        created_at: new Date('2027-01-01T00:00:00.000Z')
      } as TicketModel
    ])

    const tickets = await repository.findByIds([1])

    expect(tickets).toEqual([
      new Ticket(1, 10, 'A1', 50, TicketStatus.available, new Date('2027-01-01T00:00:00.000Z'))
    ])
  })

  it('deve buscar ticket por id', async () => {
    vi.spyOn(TicketModel, 'findById').mockResolvedValue({
      id: 7,
      event_id: 3,
      location: 'B2',
      price: 80,
      status: TicketStatus.available,
      created_at: new Date('2027-02-01T00:00:00.000Z')
    } as TicketModel)

    const ticket = await repository.findById(7)

    expect(ticket).toEqual(
      new Ticket(7, 3, 'B2', 80, TicketStatus.available, new Date('2027-02-01T00:00:00.000Z'))
    )
  })

  it('deve listar tickets por evento', async () => {
    vi.spyOn(TicketModel, 'findAll').mockResolvedValue([
      {
        id: 1,
        event_id: 5,
        location: 'A1',
        price: 50,
        status: TicketStatus.available,
        created_at: new Date()
      } as TicketModel
    ])

    const tickets = await repository.findByEventId(5)

    expect(TicketModel.findAll).toHaveBeenCalledWith(
      { where: { event_id: 5 } },
      { connection: undefined }
    )
    expect(tickets).toHaveLength(1)
  })

  it('deve criar tickets em lote', async () => {
    vi.spyOn(TicketModel, 'createMany').mockResolvedValue([
      {
        id: 1,
        event_id: 2,
        location: 'Location 0',
        price: 100,
        status: TicketStatus.available,
        created_at: new Date()
      } as TicketModel
    ])

    const tickets = await repository.createMany([
      {
        location: 'Location 0',
        eventId: 2,
        price: 100,
        status: TicketStatus.available
      }
    ])

    expect(tickets[0]?.eventId).toBe(2)
  })

  it('deve delegar reserveIfAvailable e mapear indisponibilidade', async () => {
    vi.spyOn(TicketModel, 'reserveIfAvailable').mockRejectedValue(
      new Error('Ticket 7 is not available')
    )

    await expect(repository.reserveIfAvailable(7)).rejects.toBeInstanceOf(TicketUnavailableError)
  })

  it('deve delegar sellIfAvailable e mapear ticket inexistente', async () => {
    vi.spyOn(TicketModel, 'sellIfAvailable').mockRejectedValue(new Error('Ticket not found'))

    await expect(repository.sellIfAvailable(7)).rejects.toBeInstanceOf(TicketNotFoundError)
  })

  it('deve mapear markAsSold com transição inválida', async () => {
    vi.spyOn(TicketModel, 'markAsSold').mockRejectedValue(new Error('Ticket is not reserved'))

    await expect(repository.markAsSold(7)).rejects.toBeInstanceOf(
      InvalidTicketStatusTransitionError
    )
  })

  it('deve restaurar ticket para available', async () => {
    const markMock = vi.spyOn(TicketModel, 'markAsAvailable').mockResolvedValue(undefined)

    await repository.markAsAvailable(7)

    expect(markMock).toHaveBeenCalledWith(7, { connection: undefined })
  })

  it('deve delegar releaseIfSold ao TicketModel', async () => {
    const releaseMock = vi.spyOn(TicketModel, 'releaseIfSold').mockResolvedValue(true)

    const released = await repository.releaseIfSold(7)

    expect(released).toBe(true)
    expect(releaseMock).toHaveBeenCalledWith(7, { connection: undefined })
  })
})
