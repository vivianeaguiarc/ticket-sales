export enum PurchaseStatus {
  pending = 'pending',
  paid = 'paid',
  error = 'error',
  cancelled = 'cancelled'
}

export class Purchase {
  constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly purchaseDate: Date,
    public readonly totalAmount: number,
    public status: PurchaseStatus
  ) {}
}
