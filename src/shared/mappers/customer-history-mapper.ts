import { PurchaseStatus } from '../../models/purchase-model.js'
import { ReservationStatus } from '../../models/reservation-ticket-model.js'
import { TicketStatus } from '../../models/ticket-model.js'
import {
  CustomerPurchaseHistoryItem,
  CustomerReservationHistoryItem
} from '../types/customer-history.js'

export interface PurchaseWithTicketsRow {
  purchase_id: number
  purchase_status: PurchaseStatus
  total_amount: number
  purchase_date: Date
  ticket_id: number
  ticket_location: string
  ticket_price: number
  ticket_status: TicketStatus
  event_id: number
  event_name: string
  event_date: Date
  event_location: string
}

export interface ReservationWithTicketRow {
  reservation_id: number
  reservation_status: ReservationStatus
  reservation_date: Date
  expires_at: Date
  ticket_id: number
  ticket_location: string
  ticket_price: number
  ticket_status: TicketStatus
  event_id: number
  event_name: string
  event_date: Date
  event_location: string
}

export function mapPurchaseRowsToHistory(
  rows: PurchaseWithTicketsRow[]
): CustomerPurchaseHistoryItem[] {
  const purchasesById = new Map<number, CustomerPurchaseHistoryItem>()

  for (const row of rows) {
    let purchase = purchasesById.get(row.purchase_id)

    if (!purchase) {
      purchase = {
        id: row.purchase_id,
        status: row.purchase_status,
        total_amount: row.total_amount,
        purchase_date: row.purchase_date,
        tickets: []
      }
      purchasesById.set(row.purchase_id, purchase)
    }

    purchase.tickets.push({
      id: row.ticket_id,
      location: row.ticket_location,
      price: row.ticket_price,
      status: row.ticket_status,
      event: {
        id: row.event_id,
        name: row.event_name,
        date: row.event_date,
        location: row.event_location
      }
    })
  }

  return Array.from(purchasesById.values())
}

export function mapReservationRowsToHistory(
  rows: ReservationWithTicketRow[]
): CustomerReservationHistoryItem[] {
  return rows.map((row) => ({
    id: row.reservation_id,
    status: row.reservation_status,
    reservation_date: row.reservation_date,
    expires_at: row.expires_at,
    ticket: {
      id: row.ticket_id,
      location: row.ticket_location,
      price: row.ticket_price,
      status: row.ticket_status,
      event: {
        id: row.event_id,
        name: row.event_name,
        date: row.event_date,
        location: row.event_location
      }
    }
  }))
}
