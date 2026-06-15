import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { GetTicketByIdUseCase } from './get-ticket-by-id-use-case.js'

describe('Application GetTicketByIdUseCase', () => {
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

  const useCase = new GetTicketByIdUseCase({ ticketRepository })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar ticket quando pertencer ao evento', async () => {
    vi.mocked(ticketRepository.findById).mockResolvedValue(
      new Ticket(10, 5, 'A1', 100, TicketStatus.available, new Date())
    )

    const result = await useCase.execute({ eventId: 5, ticketId: 10 })

    expect(result?.id).toBe(10)
    expect(ticketRepository.findById).toHaveBeenCalledWith(10)
  })

  it('deve retornar null quando ticket pertencer a outro evento', async () => {
    vi.mocked(ticketRepository.findById).mockResolvedValue(
      new Ticket(10, 99, 'A1', 100, TicketStatus.available, new Date())
    )

    const result = await useCase.execute({ eventId: 5, ticketId: 10 })

    expect(result).toBeNull()
  })

  it('deve retornar null quando ticket não existir', async () => {
    vi.mocked(ticketRepository.findById).mockResolvedValue(null)

    const result = await useCase.execute({ eventId: 5, ticketId: 999 })

    expect(result).toBeNull()
  })
})
