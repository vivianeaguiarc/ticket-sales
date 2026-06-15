import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  registerMock,
  findByUserIdMock,
  createEventMock,
  findAllEventsMock,
  findEventByIdMock,
  getEventHistoryMock
} = vi.hoisted(() => {
  return {
    registerMock: vi.fn(),
    findByUserIdMock: vi.fn(),
    createEventMock: vi.fn(),
    findAllEventsMock: vi.fn(),
    findEventByIdMock: vi.fn(),
    getEventHistoryMock: vi.fn()
  }
})

vi.mock('../services/partner-service.js', () => {
  return {
    PartnerService: class {
      register = registerMock
      findByUserId = findByUserIdMock
    }
  }
})

vi.mock('../services/event-service.js', () => {
  return {
    EventService: class {
      create = createEventMock
      findAll = findAllEventsMock
      findById = findEventByIdMock
      getHistory = getEventHistoryMock
    }
  }
})

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

    registerMock.mockResolvedValue(mockPartner)

    const response = await request(app).post('/partners/register').send({
      name: 'Viviane',
      email: 'viviane@email.com',
      password: '123456',
      company_name: 'Minha Empresa'
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(mockPartner)
    expect(registerMock).toHaveBeenCalledWith({
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

    const mockEvent = {
      id: 1,
      partner_id: 99,
      name: 'Evento Teste',
      description: 'Descrição teste',
      date: '2027-07-01T10:00:00.000Z',
      location: 'São Paulo',
      created_at: '2026-03-29T10:00:00.000Z'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    createEventMock.mockResolvedValue(mockEvent)

    const response = await request(app).post('/partners/events').send({
      name: 'Evento Teste',
      description: 'Descrição teste',
      date: '2027-07-01T10:00:00.000Z',
      location: 'São Paulo'
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(mockEvent)

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createEventMock).toHaveBeenCalledWith({
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
    expect(createEventMock).not.toHaveBeenCalled()
  })

  test('deve listar eventos do partner com sucesso', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    const mockEvents = [
      {
        id: 1,
        partner_id: 99,
        name: 'Evento 1'
      },
      {
        id: 2,
        partner_id: 99,
        name: 'Evento 2'
      }
    ]

    findByUserIdMock.mockResolvedValue(mockPartner)
    findAllEventsMock.mockResolvedValue(mockEvents)

    const response = await request(app).get('/partners/events')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(mockEvents)

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(findAllEventsMock).toHaveBeenCalledWith(99)
  })

  test('deve retornar 403 ao listar eventos sem autorização de partner', async () => {
    findByUserIdMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events')

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(findAllEventsMock).not.toHaveBeenCalled()
  })

  test('deve retornar evento por id com sucesso quando pertencer ao partner', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    const mockEvent = {
      id: 1,
      partner_id: 99,
      name: 'Evento Teste'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    findEventByIdMock.mockResolvedValue(mockEvent)

    const response = await request(app).get('/partners/events/1')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(mockEvent)

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(findEventByIdMock).toHaveBeenCalledWith(1)
  })

  test('deve retornar 404 quando evento não existir', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    findEventByIdMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/999')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Event not found'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(findEventByIdMock).toHaveBeenCalledWith(999)
  })

  test('deve retornar 404 quando evento pertencer a outro partner', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    const mockEvent = {
      id: 1,
      partner_id: 123,
      name: 'Evento de Outro Partner'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    findEventByIdMock.mockResolvedValue(mockEvent)

    const response = await request(app).get('/partners/events/1')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Event not found'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(findEventByIdMock).toHaveBeenCalledWith(1)
  })

  test('deve retornar 403 ao buscar evento por id sem autorização de partner', async () => {
    findByUserIdMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/1')

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(findEventByIdMock).not.toHaveBeenCalled()
  })

  test('deve retornar histórico do evento com sucesso', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    const mockEvent = {
      id: 1,
      partner_id: 99,
      name: 'Evento Teste'
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
    findEventByIdMock.mockResolvedValue(mockEvent)
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
    findEventByIdMock.mockResolvedValue(null)

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

    const mockEvent = {
      id: 1,
      partner_id: 123,
      name: 'Evento de Outro Partner'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    findEventByIdMock.mockResolvedValue(mockEvent)

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

    const mockEvent = {
      id: 1,
      partner_id: 99,
      name: 'Evento Teste'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    findEventByIdMock.mockResolvedValue(mockEvent)
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

    const mockEvent = {
      id: 1,
      partner_id: 99,
      name: 'Evento Teste'
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
    findEventByIdMock.mockResolvedValue(mockEvent)
    getEventHistoryMock.mockResolvedValue(mockHistory)

    const response = await request(app).get('/partners/events/1/history')

    expect(response.status).toBe(200)
    expect(new Date(response.body[0].created_at).getTime()).toBeGreaterThan(
      new Date(response.body[1].changed_at).getTime()
    )
  })
})
