export class PurchaseValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PurchaseValidationError'
  }
}

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('Purchase not found')
    this.name = 'PurchaseNotFoundError'
  }
}

export class PurchaseAlreadyCancelledError extends Error {
  constructor() {
    super('Purchase already cancelled')
    this.name = 'PurchaseAlreadyCancelledError'
  }
}

export class PurchaseTicketsNotFoundError extends Error {
  constructor() {
    super('Purchase tickets not found')
    this.name = 'PurchaseTicketsNotFoundError'
  }
}

export { TicketNotFoundError, TicketUnavailableError } from './ticket-errors.js'
