import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Event } from '../domain/entities/event.js'
import { Purchase, PurchaseStatus } from '../domain/entities/purchase.js'
import { Reservation, ReservationStatus } from '../domain/entities/reservation.js'

const state = {
  partnerUserId: 1,
  customerUserId: 2,
  currentUserId: 1,
  eventId: 10,
  purchaseId: 99
}

const {
  verifyMock,
  userFindByIdMock,
  partnerRegisterMock,
  partnerFindByUserIdMock,
  customerRegisterMock,
  customerFindByUserIdMock,
  authLoginMock,
  eventCreateMock,
  ticketCreateManyMock,
  createReservationExecuteMock,
  createPurchaseExecuteMock,
  purchaseCancelMock,
  healthCheckMock
} = vi.hoisted(() => ({
  verifyMock: vi.fn(),
  userFindByIdMock: vi.fn(),
  partnerRegisterMock: vi.fn(),
  partnerFindByUserIdMock: vi.fn(),
  customerRegisterMock: vi.fn(),
  customerFindByUserIdMock: vi.fn(),
  authLoginMock: vi.fn(),
  eventCreateMock: vi.fn(),
  ticketCreateManyMock: vi.fn(),
  createReservationExecuteMock: vi.fn(),
  createPurchaseExecuteMock: vi.fn(),
  purchaseCancelMock: vi.fn(),
  healthCheckMock: vi.fn()
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: verifyMock
  }
}))

vi.mock('../services/user-service.js', () => ({
  UserService: class {
    findById = userFindByIdMock
  }
}))

vi.mock('../services/health-service.js', () => ({
  HealthService: class {
    checkDatabase = healthCheckMock
  }
}))

vi.mock('../services/partner-service.js', () => ({
  PartnerService: class {
    findByUserId = partnerFindByUserIdMock
  }
}))

vi.mock('../services/customer-service.js', () => ({
  CustomerService: class {
    findByUserId = customerFindByUserIdMock
  }
}))

vi.mock('../infra/composition/identity-factory.js', () => ({
  getLoginUseCase: () => ({
    execute: authLoginMock
  }),
  getRegisterPartnerUseCase: () => ({
    execute: partnerRegisterMock
  }),
  getRegisterCustomerUseCase: () => ({
    execute: customerRegisterMock
  })
}))

vi.mock('../infra/composition/event-factory.js', () => ({
  getCreateEventUseCase: () => ({
    execute: eventCreateMock
  }),
  getGetPartnerEventsUseCase: () => ({
    execute: vi.fn()
  }),
  getGetEventByIdUseCase: () => ({
    execute: vi.fn()
  }),
  getGetEventsUseCase: () => ({
    execute: vi.fn()
  })
}))

vi.mock('../infra/composition/ticket-factory.js', () => ({
  getCreateTicketsUseCase: () => ({
    execute: ticketCreateManyMock
  }),
  getGetEventTicketsUseCase: () => ({
    execute: vi.fn()
  }),
  getGetTicketByIdUseCase: () => ({
    execute: vi.fn()
  })
}))

vi.mock('../infra/composition/create-reservation-factory.js', () => ({
  getCreateReservationUseCase: () => ({
    execute: createReservationExecuteMock
  })
}))

vi.mock('../infra/composition/purchase-factory.js', () => ({
  getCreatePurchaseUseCase: () => ({
    execute: createPurchaseExecuteMock
  }),
  getCancelPurchaseUseCase: () => ({
    execute: purchaseCancelMock
  })
}))

import { app } from '../app.js'

describe('Full ticket sales flow (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.currentUserId = state.partnerUserId

    verifyMock.mockImplementation(() => ({
      id: state.currentUserId,
      email: state.currentUserId === state.partnerUserId ? 'partner@test.com' : 'customer@test.com'
    }))

    userFindByIdMock.mockImplementation((id: number) => {
      if (id === state.partnerUserId) {
        return { id: state.partnerUserId, email: 'partner@test.com' }
      }

      if (id === state.customerUserId) {
        return { id: state.customerUserId, email: 'customer@test.com' }
      }

      return null
    })

    healthCheckMock.mockResolvedValue(true)
    partnerRegisterMock.mockResolvedValue({ id: 1, userId: state.partnerUserId })
    customerRegisterMock.mockResolvedValue({ id: 1, userId: state.customerUserId })
    authLoginMock.mockResolvedValue('jwt-token-test')
    partnerFindByUserIdMock.mockResolvedValue({ id: 1, user_id: state.partnerUserId })
    customerFindByUserIdMock.mockResolvedValue({ id: 1, user_id: state.customerUserId })
    eventCreateMock.mockResolvedValue(
      new Event(
        state.eventId,
        1,
        'Rock Festival',
        'Show',
        new Date('2027-12-01T20:00:00.000Z'),
        'São Paulo',
        new Date()
      )
    )
    ticketCreateManyMock.mockResolvedValue(undefined)
    createReservationExecuteMock.mockResolvedValue([
      new Reservation(1, 1, 1, new Date(), new Date(), ReservationStatus.reserved),
      new Reservation(2, 1, 2, new Date(), new Date(), ReservationStatus.reserved)
    ])
    createPurchaseExecuteMock.mockResolvedValue(
      new Purchase(state.purchaseId, 1, new Date(), 200, PurchaseStatus.paid)
    )
    purchaseCancelMock.mockResolvedValue(undefined)
  })

  const authHeader = () => ({ Authorization: 'Bearer jwt-token-test' })

  test('deve executar fluxo completo de venda de ingressos', async () => {
    const registerPartner = await request(app).post('/partners/register').send({
      name: 'Partner',
      email: 'partner@test.com',
      password: '123456',
      company_name: 'Events Co'
    })
    expect(registerPartner.status).toBe(201)

    const partnerLogin = await request(app).post('/auth/login').send({
      email: 'partner@test.com',
      password: '123456'
    })
    expect(partnerLogin.status).toBe(200)
    expect(partnerLogin.body).toEqual({ token: 'jwt-token-test' })

    state.currentUserId = state.partnerUserId

    const createEvent = await request(app).post('/partners/events').set(authHeader()).send({
      name: 'Rock Festival',
      description: 'Show',
      date: '2027-12-01T20:00:00.000Z',
      location: 'São Paulo'
    })
    expect(createEvent.status).toBe(201)

    const createTickets = await request(app)
      .post(`/partners/events/${state.eventId}/tickets`)
      .set(authHeader())
      .send({ num_tickets: 2, price: 100 })
    expect(createTickets.status).toBe(204)

    const registerCustomer = await request(app).post('/customers/register').send({
      name: 'Customer',
      email: 'customer@test.com',
      password: '123456',
      address: 'Rua A',
      phone: '11999999999'
    })
    expect(registerCustomer.status).toBe(201)

    const customerLogin = await request(app).post('/auth/login').send({
      email: 'customer@test.com',
      password: '123456'
    })
    expect(customerLogin.status).toBe(200)

    state.currentUserId = state.customerUserId

    const reserve = await request(app)
      .post('/partners/events/reservations')
      .set(authHeader())
      .send({ ticket_ids: [1, 2] })
    expect(reserve.status).toBe(201)

    const purchase = await request(app)
      .post('/partners/events/purchases')
      .set(authHeader())
      .send({ ticket_ids: [1, 2], card_token: 'card_token_test' })
    expect(purchase.status).toBe(201)
    expect(purchase.body.id).toBe(state.purchaseId)

    const cancel = await request(app)
      .post(`/partners/events/purchases/${state.purchaseId}/cancel`)
      .set(authHeader())
      .send()
    expect(cancel.status).toBe(200)
    expect(cancel.body).toEqual({ message: 'Purchase cancelled successfully' })

    const health = await request(app).get('/health')
    expect(health.status).toBe(200)
    expect(health.body.status).toBe('ok')
    expect(health.body.database).toBe('connected')
  })

  test('deve retornar 401 sem token em rota protegida', async () => {
    const response = await request(app).post('/partners/events').send({ name: 'X' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: 'No token provided' })
  })

  test('deve retornar 403 quando partner não estiver autorizado', async () => {
    state.currentUserId = state.partnerUserId
    partnerFindByUserIdMock.mockResolvedValue(null)

    const response = await request(app).post('/partners/events').set(authHeader()).send({
      name: 'Evento',
      date: '2027-01-01T10:00:00.000Z',
      location: 'SP'
    })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ message: 'Not authorized' })
  })

  test('deve retornar 400 em reserva sem ticket_ids', async () => {
    state.currentUserId = state.customerUserId

    const response = await request(app)
      .post('/partners/events/reservations')
      .set(authHeader())
      .send({ ticket_ids: [] })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ message: 'ticket_ids is required' })
  })

  test('deve retornar 409 em compra com ticket indisponível', async () => {
    state.currentUserId = state.customerUserId
    createPurchaseExecuteMock.mockRejectedValue(new Error('Ticket 1 is not available'))

    const response = await request(app)
      .post('/partners/events/purchases')
      .set(authHeader())
      .send({ ticket_ids: [1], card_token: 'card_token_test' })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ message: 'Ticket 1 is not available' })
  })
})
