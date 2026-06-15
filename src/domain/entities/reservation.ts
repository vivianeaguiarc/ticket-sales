export enum ReservationStatus {
  reserved = 'reserved',
  cancelled = 'cancelled'
}

export class Reservation {
  constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly ticketId: number,
    public readonly reservationDate: Date,
    public readonly expiresAt: Date,
    public readonly status: ReservationStatus
  ) {}
}
