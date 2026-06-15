import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { CreateTicketsUseCase } from './create-tickets-use-case.js'

describe('Application CreateTicketsUseCase', () => {
  const scope: TransactionScope = { kind: 'transaction' }

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

  const auditLogRepository: AuditLogRepository = {
    create: vi.fn()
  }

  const transactionManager: TransactionManager = {
    runInTransaction: vi.fn(async (work) => work(scope))
  }

  const useCase = new CreateTicketsUseCase({
    eventRepository,
    ticketRepository,
    auditLogRepository,
    transactionManager
  })

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(eventRepository.findById).mockResolvedValue({ id: 1 })
    vi.mocked(ticketRepository.createMany).mockResolvedValue([
      new Ticket(101, 1, 'Location 0', 100, TicketStatus.available, new Date()),
      new Ticket(102, 1, 'Location 1', 100, TicketStatus.available, new Date())
    ])
    vi.mocked(auditLogRepository.create).mockResolvedValue(undefined)
  })

  it('deve criar tickets com audit log em transação', async () => {
    const result = await useCase.execute({
      eventId: 1,
      numTickets: 2,
      price: 100,
      userId: 5
    })

    expect(result).toHaveLength(2)
    expect(ticketRepository.createMany).toHaveBeenCalledWith(
      [
        {
          location: 'Location 0',
          eventId: 1,
          price: 100,
          status: TicketStatus.available
        },
        {
          location: 'Location 1',
          eventId: 1,
          price: 100,
          status: TicketStatus.available
        }
      ],
      { scope }
    )
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      {
        userId: 5,
        action: AuditAction.TICKETS_CREATED,
        entityType: AuditEntityType.ticket,
        entityId: 1,
        newData: {
          event_id: 1,
          ticket_ids: [101, 102],
          quantity: 2,
          price: 100,
          status: TicketStatus.available
        }
      },
      { scope }
    )
  })

  it('deve lançar erro se evento não existir', async () => {
    vi.mocked(eventRepository.findById).mockResolvedValue(null)

    await expect(
      useCase.execute({
        eventId: 999,
        numTickets: 2,
        price: 100,
        userId: 5
      })
    ).rejects.toThrow('Event not found')

    expect(transactionManager.runInTransaction).not.toHaveBeenCalled()
  })

  it('deve propagar falha e rollback via transaction manager', async () => {
    vi.mocked(auditLogRepository.create).mockRejectedValue(new Error('Audit log failed'))

    await expect(
      useCase.execute({
        eventId: 1,
        numTickets: 1,
        price: 100,
        userId: 5
      })
    ).rejects.toThrow('Audit log failed')
  })
})
