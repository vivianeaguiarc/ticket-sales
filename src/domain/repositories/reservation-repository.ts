import { Reservation, ReservationStatus } from '../entities/reservation.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreateReservationData {
  customerId: number
  ticketId: number
  status: ReservationStatus
  expiresAt?: Date
}

export interface ReservationRepository {
  create(data: CreateReservationData, options?: RepositoryQueryOptions): Promise<Reservation>
  findReservedByCustomerAndTickets(
    customerId: number,
    ticketIds: number[],
    options?: RepositoryQueryOptions
  ): Promise<Reservation[]>
  markAsCancelled(reservationId: number, options?: RepositoryQueryOptions): Promise<void>
}
