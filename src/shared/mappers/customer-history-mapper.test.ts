import { describe, expect, it } from 'vitest'

import { PurchaseStatus } from '../../models/purchase-model.js'
import { ReservationStatus } from '../../models/reservation-ticket-model.js'
import { TicketStatus } from '../../models/ticket-model.js'
import {
  mapPurchaseRowsToHistory,
  mapReservationRowsToHistory,
  type PurchaseWithTicketsRow,
  type ReservationWithTicketRow
} from './customer-history-mapper.js'

describe('customer-history-mapper', () => {
  it('deve agrupar tickets por compra', () => {
    const purchaseDate = new Date('2026-06-15T00:00:00.000Z')
    const eventDate = new Date('2027-08-01T10:00:00.000Z')

    const rows: PurchaseWithTicketsRow[] = [
      {
        purchase_id: 1,
        purchase_status: PurchaseStatus.paid,
        total_amount: 200,
        purchase_date: purchaseDate,
        ticket_id: 3,
        ticket_location: 'A1',
        ticket_price: 100,
        ticket_status: TicketStatus.sold,
        event_id: 1,
        event_name: 'Evento Final',
        event_date: eventDate,
        event_location: 'São Paulo'
      },
      {
        purchase_id: 1,
        purchase_status: PurchaseStatus.paid,
        total_amount: 200,
        purchase_date: purchaseDate,
        ticket_id: 4,
        ticket_location: 'A2',
        ticket_price: 100,
        ticket_status: TicketStatus.sold,
        event_id: 1,
        event_name: 'Evento Final',
        event_date: eventDate,
        event_location: 'São Paulo'
      }
    ]

    const result = mapPurchaseRowsToHistory(rows)

    expect(result).toHaveLength(1)
    expect(result[0]?.tickets).toHaveLength(2)
    expect(result[0]?.tickets[0]?.event.name).toBe('Evento Final')
  })

  it('deve mapear reservas com ticket e evento', () => {
    const reservationDate = new Date('2026-06-15T00:00:00.000Z')
    const expiresAt = new Date('2026-06-15T00:05:00.000Z')
    const eventDate = new Date('2027-08-01T10:00:00.000Z')

    const rows: ReservationWithTicketRow[] = [
      {
        reservation_id: 1,
        reservation_status: ReservationStatus.reserved,
        reservation_date: reservationDate,
        expires_at: expiresAt,
        ticket_id: 1,
        ticket_location: 'A1',
        ticket_price: 100,
        ticket_status: TicketStatus.reserved,
        event_id: 1,
        event_name: 'Evento Final',
        event_date: eventDate,
        event_location: 'São Paulo'
      }
    ]

    const result = mapReservationRowsToHistory(rows)

    expect(result).toEqual([
      {
        id: 1,
        status: ReservationStatus.reserved,
        reservation_date: reservationDate,
        expires_at: expiresAt,
        ticket: {
          id: 1,
          location: 'A1',
          price: 100,
          status: TicketStatus.reserved,
          event: {
            id: 1,
            name: 'Evento Final',
            date: eventDate,
            location: 'São Paulo'
          }
        }
      }
    ])
  })
})
