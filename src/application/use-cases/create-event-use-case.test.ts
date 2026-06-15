import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Event } from '../../domain/entities/event.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { CreateEventUseCase } from './create-event-use-case.js'

describe('Application CreateEventUseCase', () => {
  const scope: TransactionScope = { kind: 'transaction' }
  const eventDate = new Date('2027-07-01T10:00:00.000Z')
  const createdAt = new Date('2027-06-15T12:00:00.000Z')

  const eventRepository: EventRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByPartnerId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }

  const auditLogRepository: AuditLogRepository = {
    create: vi.fn()
  }

  const transactionManager: TransactionManager = {
    runInTransaction: vi.fn(async (work) => work(scope))
  }

  const useCase = new CreateEventUseCase({
    eventRepository,
    auditLogRepository,
    transactionManager
  })

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(eventRepository.create).mockResolvedValue(
      new Event(10, 1, 'Show', 'Desc', eventDate, 'SP', createdAt)
    )
    vi.mocked(auditLogRepository.create).mockResolvedValue(undefined)
  })

  it('deve criar evento com audit log em transação', async () => {
    const result = await useCase.execute({
      partnerId: 1,
      userId: 5,
      name: 'Show',
      description: 'Desc',
      date: eventDate,
      location: 'SP'
    })

    expect(result.id).toBe(10)
    expect(eventRepository.create).toHaveBeenCalledWith(
      {
        partnerId: 1,
        name: 'Show',
        description: 'Desc',
        date: eventDate,
        location: 'SP'
      },
      { scope }
    )
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      {
        userId: 5,
        action: AuditAction.EVENT_CREATED,
        entityType: AuditEntityType.event,
        entityId: 10,
        newData: {
          partner_id: 1,
          name: 'Show',
          description: 'Desc',
          date: eventDate,
          location: 'SP'
        }
      },
      { scope }
    )
  })

  it('deve propagar falha para rollback via transaction manager', async () => {
    vi.mocked(auditLogRepository.create).mockRejectedValue(new Error('Audit log failed'))

    await expect(
      useCase.execute({
        partnerId: 1,
        userId: 5,
        name: 'Show',
        description: null,
        date: eventDate,
        location: 'SP'
      })
    ).rejects.toThrow('Audit log failed')
  })
})
