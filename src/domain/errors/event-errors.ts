export class EventNotFoundError extends Error {
  constructor() {
    super('Event not found')
    this.name = 'EventNotFoundError'
  }
}

export class PartnerNotFoundError extends Error {
  constructor() {
    super('Partner not found')
    this.name = 'PartnerNotFoundError'
  }
}

export class ForbiddenEventAccessError extends Error {
  constructor() {
    super('Not authorized')
    this.name = 'ForbiddenEventAccessError'
  }
}
