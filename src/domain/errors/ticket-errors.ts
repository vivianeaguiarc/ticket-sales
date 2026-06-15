export class TicketNotFoundError extends Error {
  constructor(message = 'Ticket not found') {
    super(message)
    this.name = 'TicketNotFoundError'
  }
}

export class TicketUnavailableError extends Error {
  constructor(ticketId: number) {
    super(`Ticket ${ticketId} is not available`)
    this.name = 'TicketUnavailableError'
  }
}

export class InvalidTicketStatusTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTicketStatusTransitionError'
  }
}

export class EventNotFoundError extends Error {
  constructor() {
    super('Event not found')
    this.name = 'EventNotFoundError'
  }
}
