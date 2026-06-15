import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Event } from '../../domain/entities/event.js'
import { EventNotFoundError } from '../../domain/errors/event-errors.js'
import { EventModel } from '../../models/event-model.js'
import { MysqlEventRepository } from './mysql-event-repository.js'

describe('MysqlEventRepository', () => {
  const repository = new MysqlEventRepository()

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('deve criar e mapear evento de domínio', async () => {
    vi.spyOn(EventModel, 'create').mockResolvedValue({
      id: 1,
      partner_id: 10,
      name: 'Rock',
      description: 'Show',
      date: new Date('2027-07-01T10:00:00.000Z'),
      location: 'SP',
      created_at: new Date('2027-06-15T12:00:00.000Z')
    } as EventModel)

    const event = await repository.create({
      partnerId: 10,
      name: 'Rock',
      description: 'Show',
      date: new Date('2027-07-01T10:00:00.000Z'),
      location: 'SP'
    })

    expect(event).toEqual(
      new Event(
        1,
        10,
        'Rock',
        'Show',
        new Date('2027-07-01T10:00:00.000Z'),
        'SP',
        new Date('2027-06-15T12:00:00.000Z')
      )
    )
  })

  it('deve listar eventos por partner', async () => {
    vi.spyOn(EventModel, 'findAll').mockResolvedValue([
      {
        id: 2,
        partner_id: 5,
        name: 'Jazz',
        description: null,
        date: new Date(),
        location: 'RJ',
        created_at: new Date()
      } as EventModel
    ])

    const events = await repository.findByPartnerId(5)

    expect(EventModel.findAll).toHaveBeenCalledWith({ where: { partner_id: 5 } })
    expect(events[0]?.partnerId).toBe(5)
  })

  it('deve lançar EventNotFoundError ao atualizar evento inexistente', async () => {
    vi.spyOn(EventModel, 'findById').mockResolvedValue(null)

    await expect(
      repository.update(999, {
        partnerId: 1,
        name: 'X',
        description: null,
        date: new Date(),
        location: 'SP'
      })
    ).rejects.toBeInstanceOf(EventNotFoundError)
  })

  it('deve deletar evento existente', async () => {
    const event = new EventModel({ id: 3 })
    event.delete = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(EventModel, 'findById').mockResolvedValue(event)

    await repository.delete(3)

    expect(event.delete).toHaveBeenCalled()
  })
})
