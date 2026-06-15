import { Reservation } from '../../domain/entities/reservation.js'
import {
  CreateReservationData,
  ReservationRepository
} from '../../domain/repositories/reservation-repository.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { ReservationTicketModel } from '../../models/reservation-ticket-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function toDomainReservation(model: ReservationTicketModel): Reservation {
  return new Reservation(
    model.id,
    model.customer_id,
    model.ticket_id,
    model.reservation_date,
    model.expires_at,
    model.status
  )
}

export class MysqlReservationRepository implements ReservationRepository {
  async create(
    data: CreateReservationData,
    options?: RepositoryQueryOptions
  ): Promise<Reservation> {
    const connection = resolveMysqlConnection(options?.scope)
    const reservation = await ReservationTicketModel.create(
      {
        customer_id: data.customerId,
        ticket_id: data.ticketId,
        status: data.status,
        expires_at: data.expiresAt
      },
      { connection }
    )

    return toDomainReservation(reservation)
  }
}
