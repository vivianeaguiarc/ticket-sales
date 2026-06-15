import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'

import { app } from '../app.js'
import {
  createE2eRunId,
  isDatabaseAvailable,
  resetE2eDatabase
} from './helpers/database-e2e-helper.js'

interface TicketResponse {
  id: number
  status: 'available' | 'reserved' | 'sold'
  event_id: number
}

interface AuthContext {
  partnerToken: string
  customerToken: string
  eventId: number
  ticketIds: number[]
  purchaseId: number
}

function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}

async function registerPartner(runId: string) {
  return request(app)
    .post('/partners/register')
    .send({
      name: 'E2E Partner',
      email: `partner-${runId}@e2e.test`,
      password: '123456',
      company_name: 'E2E Events Co'
    })
}

async function login(email: string, password: string) {
  return request(app).post('/auth/login').send({ email, password })
}

async function registerCustomer(runId: string) {
  return request(app)
    .post('/customers/register')
    .send({
      name: 'E2E Customer',
      email: `customer-${runId}@e2e.test`,
      password: '123456',
      address: 'Rua E2E, 100',
      phone: '11999999999'
    })
}

describe.sequential('E2E — fluxo principal de venda de ingressos', () => {
  let skipSuite = false
  let runId = ''
  let ctx: AuthContext

  beforeAll(async () => {
    skipSuite = !(await isDatabaseAvailable())

    if (skipSuite) {
      console.warn(
        '[E2E] MySQL indisponível — testes E2E ignorados. Suba o banco com: docker compose up -d mysql'
      )
      return
    }

    await resetE2eDatabase()
    runId = createE2eRunId()
    ctx = {
      partnerToken: '',
      customerToken: '',
      eventId: 0,
      ticketIds: [],
      purchaseId: 0
    }
  })

  it('1. deve registrar partner', async (context) => {
    if (skipSuite) context.skip()

    const response = await registerPartner(runId)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      name: 'E2E Partner',
      company_name: 'E2E Events Co'
    })
    expect(response.body.id).toBeTypeOf('number')
    expect(response.body.userId).toBeTypeOf('number')
  })

  it('2. deve fazer login do partner e retornar token JWT', async (context) => {
    if (skipSuite) context.skip()

    const response = await login(`partner-${runId}@e2e.test`, '123456')

    expect(response.status).toBe(200)
    expect(response.body.token).toBeTypeOf('string')
    expect(response.body.token.length).toBeGreaterThan(20)

    ctx.partnerToken = response.body.token
  })

  it('3. deve criar evento autenticado como partner', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app)
      .post('/partners/events')
      .set(authHeader(ctx.partnerToken))
      .send({
        name: 'E2E Rock Festival',
        description: 'Show E2E',
        date: '2027-12-01T20:00:00.000Z',
        location: 'São Paulo'
      })

    expect(response.status).toBe(201)
    expect(response.body.id).toBeTypeOf('number')
    expect(response.body.name).toBe('E2E Rock Festival')
    expect(response.body.partner_id).toBeTypeOf('number')

    ctx.eventId = response.body.id
  })

  it('4. deve criar tickets em lote para o evento', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app)
      .post(`/partners/events/${ctx.eventId}/tickets`)
      .set(authHeader(ctx.partnerToken))
      .send({ num_tickets: 5, price: 100 })

    expect(response.status).toBe(204)

    const listResponse = await request(app)
      .get(`/partners/events/${ctx.eventId}/tickets`)
      .set(authHeader(ctx.partnerToken))

    expect(listResponse.status).toBe(200)
    expect(listResponse.body).toHaveLength(5)

    const tickets = listResponse.body as TicketResponse[]
    ctx.ticketIds = tickets.map((ticket) => ticket.id)

    for (const ticket of tickets) {
      expect(ticket.status).toBe('available')
      expect(ticket.event_id).toBe(ctx.eventId)
    }
  })

  it('5. deve registrar customer', async (context) => {
    if (skipSuite) context.skip()

    const response = await registerCustomer(runId)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      name: 'E2E Customer',
      address: 'Rua E2E, 100',
      phone: '11999999999'
    })
    expect(response.body.id).toBeTypeOf('number')
    expect(response.body.userId).toBeTypeOf('number')
  })

  it('6. deve fazer login do customer e retornar token JWT', async (context) => {
    if (skipSuite) context.skip()

    const response = await login(`customer-${runId}@e2e.test`, '123456')

    expect(response.status).toBe(200)
    expect(response.body.token).toBeTypeOf('string')

    ctx.customerToken = response.body.token
  })

  it('7. deve reservar tickets como customer', async (context) => {
    if (skipSuite) context.skip()

    const reserveIds = [ctx.ticketIds[0], ctx.ticketIds[1]]

    const response = await request(app)
      .post('/partners/events/reservations')
      .set(authHeader(ctx.customerToken))
      .send({ ticket_ids: reserveIds })

    expect(response.status).toBe(201)
    expect(response.body).toHaveLength(2)

    for (const reservation of response.body) {
      expect(reserveIds).toContain(reservation.ticket_id)
      expect(reservation.status).toBe('reserved')
    }

    const listResponse = await request(app)
      .get(`/partners/events/${ctx.eventId}/tickets`)
      .set(authHeader(ctx.partnerToken))

    const tickets = listResponse.body as TicketResponse[]
    const reserved = tickets.filter((ticket) => reserveIds.includes(ticket.id))

    expect(reserved.every((ticket) => ticket.status === 'reserved')).toBe(true)
  })

  it('8. deve comprar outros tickets como customer', async (context) => {
    if (skipSuite) context.skip()

    const purchaseIds = [ctx.ticketIds[2], ctx.ticketIds[3]]

    const response = await request(app)
      .post('/partners/events/purchases')
      .set(authHeader(ctx.customerToken))
      .send({
        ticket_ids: purchaseIds,
        card_token: 'card_token_e2e_test'
      })

    expect(response.status).toBe(201)
    expect(response.body.id).toBeTypeOf('number')
    expect(response.body.status).toBe('paid')
    expect(response.body.customer_id).toBeTypeOf('number')

    ctx.purchaseId = response.body.id

    const listResponse = await request(app)
      .get(`/partners/events/${ctx.eventId}/tickets`)
      .set(authHeader(ctx.partnerToken))

    const tickets = listResponse.body as TicketResponse[]
    const sold = tickets.filter((ticket) => purchaseIds.includes(ticket.id))

    expect(sold.every((ticket) => ticket.status === 'sold')).toBe(true)
  })

  it('9. deve cancelar a compra e restaurar tickets para available', async (context) => {
    if (skipSuite) context.skip()

    const purchaseIds = [ctx.ticketIds[2], ctx.ticketIds[3]]

    const response = await request(app)
      .post(`/partners/events/purchases/${ctx.purchaseId}/cancel`)
      .set(authHeader(ctx.customerToken))

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ message: 'Purchase cancelled successfully' })

    const listResponse = await request(app)
      .get(`/partners/events/${ctx.eventId}/tickets`)
      .set(authHeader(ctx.partnerToken))

    const tickets = listResponse.body as TicketResponse[]
    const cancelledTickets = tickets.filter((ticket) => purchaseIds.includes(ticket.id))
    const stillReserved = tickets.filter((ticket) =>
      [ctx.ticketIds[0], ctx.ticketIds[1]].includes(ticket.id)
    )

    expect(cancelledTickets.every((ticket) => ticket.status === 'available')).toBe(true)
    expect(stillReserved.every((ticket) => ticket.status === 'reserved')).toBe(true)
  })

  it('10. deve responder health check com banco conectado', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.database).toBe('connected')
  })
})

describe.sequential('E2E — cenários de erro importantes', () => {
  let skipSuite = false
  let runId = ''
  let partnerToken = ''
  let customerToken = ''
  let eventId = 0
  let reservedTicketId = 0

  beforeAll(async () => {
    skipSuite = !(await isDatabaseAvailable())

    if (skipSuite) {
      console.warn('[E2E] MySQL indisponível — cenários de erro ignorados.')
      return
    }

    await resetE2eDatabase()
    runId = createE2eRunId()

    await request(app)
      .post('/partners/register')
      .send({
        name: 'Partner Error E2E',
        email: `partner-err-${runId}@e2e.test`,
        password: '123456',
        company_name: 'Error Test Co'
      })

    const partnerLogin = await request(app)
      .post('/auth/login')
      .send({
        email: `partner-err-${runId}@e2e.test`,
        password: '123456'
      })
    partnerToken = partnerLogin.body.token

    const eventResponse = await request(app)
      .post('/partners/events')
      .set(authHeader(partnerToken))
      .send({
        name: 'Error Test Event',
        description: 'E2E errors',
        date: '2027-11-01T18:00:00.000Z',
        location: 'SP'
      })
    eventId = eventResponse.body.id

    await request(app)
      .post(`/partners/events/${eventId}/tickets`)
      .set(authHeader(partnerToken))
      .send({ num_tickets: 2, price: 50 })

    await request(app)
      .post('/customers/register')
      .send({
        name: 'Customer Error E2E',
        email: `customer-err-${runId}@e2e.test`,
        password: '123456',
        address: 'Rua Erro',
        phone: '11888888888'
      })

    const customerLogin = await request(app)
      .post('/auth/login')
      .send({
        email: `customer-err-${runId}@e2e.test`,
        password: '123456'
      })
    customerToken = customerLogin.body.token

    const ticketsResponse = await request(app)
      .get(`/partners/events/${eventId}/tickets`)
      .set(authHeader(partnerToken))

    reservedTicketId = ticketsResponse.body[0].id

    await request(app)
      .post('/partners/events/reservations')
      .set(authHeader(customerToken))
      .send({ ticket_ids: [reservedTicketId] })
  })

  it('deve retornar 401 para login inválido', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: `partner-err-${runId}@e2e.test`,
        password: 'senha-errada'
      })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: 'Invalid email or password' })
  })

  it('deve retornar 401 ao acessar rota protegida sem token', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app).post('/partners/events').send({ name: 'Sem token' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: 'No token provided' })
  })

  it('deve retornar 409 ao reservar ticket indisponível', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app)
      .post('/partners/events/reservations')
      .set(authHeader(customerToken))
      .send({ ticket_ids: [reservedTicketId] })

    expect(response.status).toBe(409)
    expect(response.body.message).toMatch(/not available/)
  })

  it('deve retornar 404 ao comprar ticket inexistente', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app)
      .post('/partners/events/purchases')
      .set(authHeader(customerToken))
      .send({
        ticket_ids: [999999],
        card_token: 'card_token_e2e'
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Some tickets not found' })
  })

  it('deve retornar 404 ao cancelar purchase inexistente', async (context) => {
    if (skipSuite) context.skip()

    const response = await request(app)
      .post('/partners/events/purchases/999999/cancel')
      .set(authHeader(customerToken))

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Purchase not found' })
  })
})
