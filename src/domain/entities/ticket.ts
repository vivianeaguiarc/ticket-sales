export enum TicketStatus {
  available = 'available',
  reserved = 'reserved',
  sold = 'sold'
}

export class Ticket {
  constructor(
    public readonly id: number,
    public readonly eventId: number,
    public readonly location: string,
    public readonly price: number,
    public readonly status: TicketStatus,
    public readonly createdAt: Date
  ) {}
}
