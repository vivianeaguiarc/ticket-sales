import request from 'supertest'

import { app } from '../src/app.js'
import { createE2eRunId, resetE2eDatabase } from '../src/e2e/helpers/database-e2e-helper.js'

const runId = createE2eRunId()
await resetE2eDatabase()

await request(app)
  .post('/partners/register')
  .send({
    name: 'E2E Partner',
    email: `partner-${runId}@e2e.test`,
    password: '123456',
    company_name: 'E2E Events Co'
  })

const loginP = await request(app)
  .post('/auth/login')
  .send({
    email: `partner-${runId}@e2e.test`,
    password: '123456'
  })
const tokenP = loginP.body.token as string

const ev = await request(app)
  .post('/partners/events')
  .set('Authorization', `Bearer ${tokenP}`)
  .send({
    name: 'E2E Rock Festival',
    description: 'Show E2E',
    date: '2027-12-01T20:00:00.000Z',
    location: 'São Paulo'
  })

await request(app)
  .post(`/partners/events/${ev.body.id}/tickets`)
  .set('Authorization', `Bearer ${tokenP}`)
  .send({ num_tickets: 5, price: 100 })

await request(app)
  .post('/customers/register')
  .send({
    name: 'E2E Customer',
    email: `customer-${runId}@e2e.test`,
    password: '123456',
    address: 'Rua E2E, 100',
    phone: '11999999999'
  })

const loginC = await request(app)
  .post('/auth/login')
  .send({
    email: `customer-${runId}@e2e.test`,
    password: '123456'
  })
const tokenC = loginC.body.token as string

const tickets = await request(app)
  .get(`/partners/events/${ev.body.id}/tickets`)
  .set('Authorization', `Bearer ${tokenP}`)

const ids = (tickets.body as { id: number; status: string }[]).map((ticket) => ticket.id)

await request(app)
  .post('/partners/events/reservations')
  .set('Authorization', `Bearer ${tokenC}`)
  .send({ ticket_ids: [ids[0], ids[1]] })

const purchase = await request(app)
  .post('/partners/events/purchases')
  .set('Authorization', `Bearer ${tokenC}`)
  .send({
    ticket_ids: [ids[2], ids[3]],
    card_token: 'card_token_e2e_test'
  })

console.log('purchase', purchase.status, purchase.body)
