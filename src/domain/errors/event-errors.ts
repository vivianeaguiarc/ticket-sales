export class EventNotFoundError extends Error {
  constructor() {
    super('Event not found')
    this.name = 'EventNotFoundError'
  }
}

export { PartnerNotFoundError } from './identity-errors.js'

export class ForbiddenEventAccessError extends Error {
  constructor() {
    super('Not authorized')
    this.name = 'ForbiddenEventAccessError'
  }
}
