export class PurchaseTicket {
  constructor(
    public readonly id: number,
    public readonly purchaseId: number,
    public readonly ticketId: number
  ) {}
}
