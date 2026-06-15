import { Reservation } from '../../domain/entities/reservation.js'
import { ReservationTicketModel } from '../../models/reservation-ticket-model.js'

export function toReservationTicketModel(reservation: Reservation): ReservationTicketModel {
  return new ReservationTicketModel({
    id: reservation.id,
    customer_id: reservation.customerId,
    ticket_id: reservation.ticketId,
    reservation_date: reservation.reservationDate,
    expires_at: reservation.expiresAt,
    status: reservation.status
  })
}

export function toReservationTicketModels(reservations: Reservation[]): ReservationTicketModel[] {
  return reservations.map(toReservationTicketModel)
}
