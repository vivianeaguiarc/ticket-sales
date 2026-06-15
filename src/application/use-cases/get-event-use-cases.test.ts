import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Event } from '../../domain/entities/event.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'
import { GetEventByIdUseCase } from './get-event-by-id-use-case.js'
import { GetEventsUseCase } from './get-events-use-case.js'
import { GetPartnerEventsUseCase } from './get-partner-events-use-case.js'

describe('Application Event query use cases', () => {
  const eventRepository: EventRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByPartnerId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }

  const sampleEvent = new Event(
    1,
    99,
    'Festival',
    'Desc',
    new Date('2027-07-01T10:00:00.000Z'),
    'SP',
    new Date('2027-06-15T12:00:00.000Z')
  )

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(eventRepository.findAll).mockResolvedValue([sampleEvent])
    vi.mocked(eventRepository.findByPartnerId).mockResolvedValue([sampleEvent])
    vi.mocked(eventRepository.findById).mockResolvedValue(sampleEvent)
  })

  it('GetEventsUseCase deve listar todos os eventos', async () => {
    const useCase = new GetEventsUseCase(eventRepository)
    const result = await useCase.execute()

    expect(result).toHaveLength(1)
    expect(eventRepository.findAll).toHaveBeenCalled()
  })

  it('GetPartnerEventsUseCase deve listar eventos do partner', async () => {
    const useCase = new GetPartnerEventsUseCase(eventRepository)
    const result = await useCase.execute({ partnerId: 99 })

    expect(result).toHaveLength(1)
    expect(eventRepository.findByPartnerId).toHaveBeenCalledWith(99)
  })

  it('GetEventByIdUseCase deve buscar evento por id', async () => {
    const useCase = new GetEventByIdUseCase(eventRepository)
    const result = await useCase.execute({ eventId: 1 })

    expect(result?.id).toBe(1)
    expect(eventRepository.findById).toHaveBeenCalledWith(1)
  })

  it('GetEventByIdUseCase deve retornar null quando evento não existir', async () => {
    vi.mocked(eventRepository.findById).mockResolvedValue(null)

    const useCase = new GetEventByIdUseCase(eventRepository)
    const result = await useCase.execute({ eventId: 999 })

    expect(result).toBeNull()
  })
})
