import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import { TicketModel } from '../../models/ticket-model.js'
import { MysqlTicketRepository } from './mysql-ticket-repository.js'

describe('MysqlTicketRepository', () => {
  const repository = new MysqlTicketRepository()

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('deve mapear tickets do model para entidade de domínio', async () => {
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

  it('deve delegar reserveIfAvailable ao TicketModel', async () => {
    const reserveMock = vi.spyOn(TicketModel, 'reserveIfAvailable').mockResolvedValue(undefined)

    await repository.reserveIfAvailable(7)

    expect(reserveMock).toHaveBeenCalledWith(7, { connection: undefined })
  })
})
