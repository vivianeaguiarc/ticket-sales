import { Database } from '../database.js'
import { PurchaseModel, PurchaseStatus } from '../models/purchase-model.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

interface Input {
  customer_id: number
  ticket_ids: number[]
}

export class CreatePurchaseUseCase {
  static async execute(input: Input) {
    const { customer_id, ticket_ids } = input

    console.log('🟡 [CreatePurchaseUseCase] input recebido:', input)

    if (!ticket_ids || ticket_ids.length === 0) {
      console.log('🔴 [CreatePurchaseUseCase] ticket_ids vazio')
      throw new Error('ticket_ids is required')
    }

    const pool = Database.getInstance()
    const connection = await pool.getConnection()

    try {
      console.log('🟡 [CreatePurchaseUseCase] iniciando transação')
      await connection.beginTransaction()

      console.log('🟡 [CreatePurchaseUseCase] buscando tickets:', ticket_ids)

      const tickets = await TicketModel.findAll(
        {
          where: {
            ids: ticket_ids
          }
        },
        { connection }
      )

      console.log('🟢 [CreatePurchaseUseCase] tickets encontrados:', tickets)

      if (tickets.length !== ticket_ids.length) {
        console.log(
          '🔴 [CreatePurchaseUseCase] quantidade de tickets encontrada diferente da solicitada',
          {
            encontrados: tickets.length,
            solicitados: ticket_ids.length
          }
        )
        throw new Error('Some tickets not found')
      }

      for (const ticket of tickets) {
        console.log('🟡 [CreatePurchaseUseCase] validando ticket:', {
          id: ticket.id,
          status: ticket.status,
          price: ticket.price
        })

        if (ticket.status !== TicketStatus.available) {
          console.log('🔴 [CreatePurchaseUseCase] ticket indisponível:', ticket)
          throw new Error(`Ticket ${ticket.id} is not available`)
        }
      }

      const total_amount = tickets.reduce((total, ticket) => {
        return total + Number(ticket.price)
      }, 0)

      console.log('🟢 [CreatePurchaseUseCase] total_amount calculado:', total_amount)

      const purchase = await PurchaseModel.create(
        {
          customer_id,
          total_amount,
          status: PurchaseStatus.paid
        },
        { connection }
      )

      console.log('🟢 [CreatePurchaseUseCase] purchase criada:', purchase)

      for (const ticket of tickets) {
        console.log('🟡 [CreatePurchaseUseCase] processando ticket:', ticket.id)

        await TicketModel.markAsSold(ticket.id, { connection })
        console.log('🟢 [CreatePurchaseUseCase] ticket marcado como sold:', ticket.id)

        await TicketStatusHistoryModel.create(
          {
            ticket_id: ticket.id,
            from_status: TicketStatus.available,
            to_status: TicketStatus.sold
          },
          { connection }
        )
        console.log('🟢 [CreatePurchaseUseCase] histórico criado para ticket:', ticket.id)

        await PurchaseTicketModel.create(
          {
            purchase_id: purchase.id,
            ticket_id: ticket.id
          },
          { connection }
        )
        console.log('🟢 [CreatePurchaseUseCase] purchase_ticket criado:', {
          purchase_id: purchase.id,
          ticket_id: ticket.id
        })
      }

      await connection.commit()
      console.log('🟢 [CreatePurchaseUseCase] transação confirmada com sucesso')

      return purchase
    } catch (error) {
      console.log('🔴 [CreatePurchaseUseCase] erro capturado, executando rollback')
      await connection.rollback()
      console.error('🔴 [CreatePurchaseUseCase] erro completo:', error)
      throw error
    } finally {
      console.log('🟡 [CreatePurchaseUseCase] liberando conexão')
      connection.release()
    }
  }
}
