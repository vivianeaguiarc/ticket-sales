import { TicketStatus } from './ticket.js'

export class TicketStatusHistory {
  constructor(
    public readonly id: number,
    public readonly ticketId: number,
    public readonly fromStatus: TicketStatus,
    public readonly toStatus: TicketStatus,
    public readonly changedAt: Date
  ) {}
}
