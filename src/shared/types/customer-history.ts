import { PurchaseStatus } from '../../models/purchase-model.js'
import { ReservationStatus } from '../../models/reservation-ticket-model.js'
import { TicketStatus } from '../../models/ticket-model.js'

export interface CustomerEventSummary {
  id: number
  name: string
  date: Date
  location: string
}

export interface CustomerPurchaseTicket {
  id: number
  location: string
  price: number
  status: TicketStatus
  event: CustomerEventSummary
}

export interface CustomerPurchaseHistoryItem {
  id: number
  status: PurchaseStatus
  total_amount: number
  purchase_date: Date
  tickets: CustomerPurchaseTicket[]
}

export interface CustomerReservationTicket {
  id: number
  location: string
  price: number
  status: TicketStatus
  event: CustomerEventSummary
}

export interface CustomerReservationHistoryItem {
  id: number
  status: ReservationStatus
  reservation_date: Date
  expires_at: Date
  ticket: CustomerReservationTicket
}
