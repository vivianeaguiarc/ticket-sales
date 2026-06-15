import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Event } from '../domain/entities/event.js'

const {
  registerExecuteMock,
  findByUserIdMock,
  createEventExecuteMock,
  getPartnerEventsExecuteMock,
  getEventByIdExecuteMock,
  getEventHistoryMock
} = vi.hoisted(() => {
  return {
    registerExecuteMock: vi.fn(),
    findByUserIdMock: vi.fn(),
    createEventExecuteMock: vi.fn(),
    getPartnerEventsExecuteMock: vi.fn(),
    getEventByIdExecuteMock: vi.fn(),
    getEventHistoryMock: vi.fn()
  }
})

vi.mock('../services/partner-service.js', () => {
  return {
    PartnerService: class {
      findByUserId = findByUserIdMock
    }
  }
})

vi.mock('../infra/composition/identity-factory.js', () => ({
  getRegisterPartnerUseCase: () => ({
    execute: registerExecuteMock
  })
}))

vi.mock('../infra/composition/event-factory.js', () => ({
  getCreateEventUseCase: () => ({
    execute: createEventExecuteMock
  }),
  getGetPartnerEventsUseCase: () => ({
    execute: getPartnerEventsExecuteMock
  }),
  getGetEventByIdUseCase: () => ({
    execute: getEventByIdExecuteMock
  })
}))

vi.mock('../services/event-service.js', () => ({
  EventService: class {
    getHistory = getEventHistoryMock
  }
}))

import { partnerRoutes } from './partner-controller.js'

describe('PartnerController', () => {
  const app = express()

  app.use(express.json())

  app.use((req, _res, next) => {
    req.user = { id: 1, email: 'partner@email.com' }
    next()
  })

  app.use('/partners', partnerRoutes)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('deve registrar um partner com sucesso', async () => {
    const mockPartner = {
      id: 10,
      name: 'Viviane',
      userId: 1,
      company_name: 'Minha Empresa',
      createdAt: '2026-03-29T10:00:00.000Z'
    }

    registerExecuteMock.mockResolvedValue(mockPartner)

    const response = await request(app).post('/partners/register').send({
      name: 'Viviane',
      email: 'viviane@email.com',
      password: '123456',
      company_name: 'Minha Empresa'
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(mockPartner)
    expect(registerExecuteMock).toHaveBeenCalledWith({
      name: 'Viviane',
      email: 'viviane@email.com',
      password: '123456',
      company_name: 'Minha Empresa'
    })
  })

  test('deve criar evento com sucesso para um partner autorizado', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    createEventExecuteMock.mockResolvedValue(
      new Event(
        1,
        99,
        'Evento Teste',
        'Descrição teste',
        new Date('2027-07-01T10:00:00.000Z'),
        'São Paulo',
        new Date('2026-03-29T10:00:00.000Z')
      )
    )

    const response = await request(app).post('/partners/events').send({
      name: 'Evento Teste',
      description: 'Descrição teste',
      date: '2027-07-01T10:00:00.000Z',
      location: 'São Paulo'
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      id: 1,
      partner_id: 99,
      name: 'Evento Teste',
      location: 'São Paulo'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createEventExecuteMock).toHaveBeenCalledWith({
      name: 'Evento Teste',
      description: 'Descrição teste',
      date: new Date('2027-07-01T10:00:00.000Z'),
      location: 'São Paulo',
      partnerId: 99,
      userId: 1
    })
  })

  test('deve retornar 403 ao tentar criar evento sem autorização de partner', async () => {
    findByUserIdMock.mockResolvedValue(null)

    const response = await request(app).post('/partners/events').send({
      name: 'Evento Teste',
      description: 'Descrição teste',
      date: '2027-07-01T10:00:00.000Z',
      location: 'São Paulo'
    })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createEventExecuteMock).not.toHaveBeenCalled()
  })

  test('deve listar eventos do partner com sucesso', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    getPartnerEventsExecuteMock.mockResolvedValue([
      new Event(1, 99, 'Evento 1', null, new Date(), 'SP', new Date()),
      new Event(2, 99, 'Evento 2', null, new Date(), 'RJ', new Date())
    ])

    const response = await request(app).get('/partners/events')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(2)
    expect(response.body[0]).toMatchObject({ id: 1, partner_id: 99, name: 'Evento 1' })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(getPartnerEventsExecuteMock).toHaveBeenCalledWith({ partnerId: 99 })
  })

  test('deve retornar 403 ao listar eventos sem autorização de partner', async () => {
    findByUserIdMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events')

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(getPartnerEventsExecuteMock).not.toHaveBeenCalled()
  })

  test('deve retornar evento por id com sucesso quando pertencer ao partner', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(
      new Event(1, 99, 'Evento Teste', null, new Date(), 'SP', new Date())
    )

    const response = await request(app).get('/partners/events/1')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: 1, partner_id: 99, name: 'Evento Teste' })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(getEventByIdExecuteMock).toHaveBeenCalledWith({ eventId: 1 })
  })

  test('deve retornar 404 quando evento não existir', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/999')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Event not found'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(getEventByIdExecuteMock).toHaveBeenCalledWith({ eventId: 999 })
  })

  test('deve retornar 404 quando evento pertencer a outro partner', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(
      new Event(1, 123, 'Evento de Outro Partner', null, new Date(), 'SP', new Date())
    )

    const response = await request(app).get('/partners/events/1')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Event not found'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(getEventByIdExecuteMock).toHaveBeenCalledWith({ eventId: 1 })
  })

  test('deve retornar 403 ao buscar evento por id sem autorização de partner', async () => {
    findByUserIdMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/1')

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(getEventByIdExecuteMock).not.toHaveBeenCalled()
  })

  test('deve retornar histórico do evento com sucesso', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    const mockHistory = [
      {
        type: 'audit_log',
        action: 'PURCHASE_CREATED',
        entity_type: 'purchase',
        entity_id: 3,
        created_at: '2026-04-01T12:05:00.000Z'
      },
      {
        type: 'ticket_status_history',
        ticket_id: 1,
        from_status: 'available',
        to_status: 'reserved',
        changed_at: '2026-04-01T12:00:00.000Z'
      }
    ]

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(
      new Event(1, 99, 'Evento Teste', null, new Date(), 'SP', new Date())
    )
    getEventHistoryMock.mockResolvedValue(mockHistory)

    const response = await request(app).get('/partners/events/1/history')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(mockHistory)
    expect(getEventHistoryMock).toHaveBeenCalledWith(1)
  })

  test('deve retornar 404 ao consultar histórico de evento inexistente', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/999/history')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Event not found' })
    expect(getEventHistoryMock).not.toHaveBeenCalled()
  })

  test('deve retornar 403 ao consultar histórico de evento de outro partner', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(
      new Event(1, 123, 'Evento de Outro Partner', null, new Date(), 'SP', new Date())
    )

    const response = await request(app).get('/partners/events/1/history')

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ message: 'Not authorized' })
    expect(getEventHistoryMock).not.toHaveBeenCalled()
  })

  test('deve retornar lista vazia quando não houver histórico', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(
      new Event(1, 99, 'Evento Teste', null, new Date(), 'SP', new Date())
    )
    getEventHistoryMock.mockResolvedValue([])

    const response = await request(app).get('/partners/events/1/history')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('deve validar ordenação decrescente do histórico retornado', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    const mockHistory = [
      {
        type: 'audit_log',
        action: 'PURCHASE_CREATED',
        entity_type: 'purchase',
        entity_id: 3,
        created_at: '2026-04-01T12:05:00.000Z'
      },
      {
        type: 'ticket_status_history',
        ticket_id: 1,
        from_status: 'available',
        to_status: 'reserved',
        changed_at: '2026-04-01T12:00:00.000Z'
      }
    ]

    findByUserIdMock.mockResolvedValue(mockPartner)
    getEventByIdExecuteMock.mockResolvedValue(
      new Event(1, 99, 'Evento Teste', null, new Date(), 'SP', new Date())
    )
    getEventHistoryMock.mockResolvedValue(mockHistory)

    const response = await request(app).get('/partners/events/1/history')

    expect(response.status).toBe(200)
    expect(new Date(response.body[0].created_at).getTime()).toBeGreaterThan(
      new Date(response.body[1].changed_at).getTime()
    )
  })
})
