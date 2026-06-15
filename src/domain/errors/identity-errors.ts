export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid email or password') {
    super(message)
    this.name = 'InvalidCredentialsError'
  }
}

export class UserAlreadyExistsError extends Error {
  constructor(message = 'User already exists') {
    super(message)
    this.name = 'UserAlreadyExistsError'
  }
}

export class UserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message)
    this.name = 'UserNotFoundError'
  }
}

export class PartnerNotFoundError extends Error {
  constructor(message = 'Partner not found') {
    super(message)
    this.name = 'PartnerNotFoundError'
  }
}

export class CustomerNotFoundError extends Error {
  constructor(message = 'Customer not found') {
    super(message)
    this.name = 'CustomerNotFoundError'
  }
}
