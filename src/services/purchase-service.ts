import { PoolConnection } from 'mysql2/promise'

import { Database } from '../database.js'
import { CustomerModel } from '../models/customer-model.js'
import { PurchaseModel, PurchaseStatus } from '../models/purchase-model.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel } from '../models/ticket-model.js'
import { PaymentService } from './payment-service.js'

export class PurchaseService {
  constructor(private paymentService: PaymentService) {}

  async create(data: {
    customerId: number
    ticketIds: number[]
    cardToken: string
  }): Promise<number> {
    const customer = await CustomerModel.findById(data.customerId, {
      user: true
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    const db = Database.getInstance()
    const connection = await db.getConnection()

    let purchase: PurchaseModel | undefined

    try {
      await connection.beginTransaction()

      const tickets = await TicketModel.findAll(
        {
          where: { ids: data.ticketIds }
        },
        { connection }
      )

      if (tickets.length !== data.ticketIds.length) {
        throw new Error('Some tickets not found')
      }

      const amount = tickets.reduce((total, ticket) => total + ticket.price, 0)

      for (const ticket of tickets) {
        await TicketModel.reserveIfAvailable(ticket.id, { connection })
      }

      purchase = await PurchaseModel.create(
        {
          customer_id: data.customerId,
          total_amount: amount,
          status: PurchaseStatus.pending
        },
        { connection }
      )

      await this.associateTicketsWithPurchase(purchase.id, data.ticketIds, connection)

      for (const ticket of tickets) {
        await ReservationTicketModel.create(
          {
            customer_id: data.customerId,
            ticket_id: ticket.id,
            status: ReservationStatus.reserved
          },
          { connection }
        )
      }

      await this.paymentService.processPayment(
        {
          name: customer.user!.name,
          email: customer.user!.email,
          address: customer.address,
          phone: customer.phone
        },
        purchase.total_amount,
        data.cardToken
      )

      for (const ticket of tickets) {
        await TicketModel.markAsSold(ticket.id, { connection })
      }

      purchase.status = PurchaseStatus.paid
      await purchase.update({ connection })

      await connection.commit()

      return purchase.id
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async cancel(purchaseId: number): Promise<void> {
    const purchase = await PurchaseModel.findById(purchaseId)

    if (!purchase) {
      throw new Error('Purchase not found')
    }

    if (purchase.status === PurchaseStatus.cancelled) {
      throw new Error('Purchase already cancelled')
    }

    const purchaseTickets = await PurchaseTicketModel.findAll({
      where: { purchase_id: purchaseId }
    })

    const ticketIds = purchaseTickets.map((purchaseTicket) => purchaseTicket.ticket_id)

    const reservations = await ReservationTicketModel.findAll({
      where: {
        customer_id: purchase.customer_id,
        ticket_id: ticketIds,
        status: ReservationStatus.reserved
      }
    })

    const db = Database.getInstance()
    const connection = await db.getConnection()

    try {
      await connection.beginTransaction()

      for (const ticketId of ticketIds) {
        await TicketModel.markAsAvailable(ticketId, { connection })
      }

      for (const reservation of reservations) {
        reservation.status = ReservationStatus.cancelled
        await reservation.update({ connection })
      }

      purchase.status = PurchaseStatus.cancelled
      await purchase.update({ connection })

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  private async associateTicketsWithPurchase(
    purchaseId: number,
    ticketIds: number[],
    connection: PoolConnection
  ): Promise<void> {
    const purchaseTickets = ticketIds.map((ticketId) => ({
      purchase_id: purchaseId,
      ticket_id: ticketId
    }))

    await PurchaseTicketModel.createMany(purchaseTickets, { connection })
  }

  async findById(id: number): Promise<PurchaseModel | null> {
    return PurchaseModel.findById(id)
  }
}
