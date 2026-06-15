import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { GetEventTicketsUseCase } from './get-event-tickets-use-case.js'

describe('Application GetEventTicketsUseCase', () => {
  const eventRepository: EventRepository = {
    findById: vi.fn()
  }

  const ticketRepository: TicketRepository = {
    findById: vi.fn(),
    findByIds: vi.fn(),
    findByEventId: vi.fn(),
    createMany: vi.fn(),
    reserveIfAvailable: vi.fn(),
    sellIfAvailable: vi.fn(),
    markAsSold: vi.fn(),
    markAsAvailable: vi.fn(),
    releaseIfSold: vi.fn()
  }

  const useCase = new GetEventTicketsUseCase({
    eventRepository,
    ticketRepository
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(eventRepository.findById).mockResolvedValue({ id: 5 })
    vi.mocked(ticketRepository.findByEventId).mockResolvedValue([
      new Ticket(1, 5, 'A1', 100, TicketStatus.available, new Date())
    ])
  })

  it('deve listar tickets do evento', async () => {
    const result = await useCase.execute({ eventId: 5 })

    expect(result).toHaveLength(1)
    expect(ticketRepository.findByEventId).toHaveBeenCalledWith(5)
  })

  it('deve lançar erro se evento não existir', async () => {
    vi.mocked(eventRepository.findById).mockResolvedValue(null)

    await expect(useCase.execute({ eventId: 999 })).rejects.toThrow('Event not found')
    expect(ticketRepository.findByEventId).not.toHaveBeenCalled()
  })
})
