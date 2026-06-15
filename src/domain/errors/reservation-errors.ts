export class ReservationValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReservationValidationError'
  }
}

export class TicketsNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TicketsNotFoundError'
  }
}

export class TicketNotAvailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TicketNotAvailableError'
  }
}
