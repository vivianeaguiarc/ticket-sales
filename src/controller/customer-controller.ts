import { Request, Response, Router } from 'express'

import { CustomerNotFoundError } from '../domain/errors/identity-errors.js'
import { getRegisterCustomerUseCase } from '../infra/composition/identity-factory.js'
import { CustomerService } from '../services/customer-service.js'

export const customerRoutes = Router()

customerRoutes.post('/register', async (req, res) => {
  const { name, email, password, address, phone } = req.body
  const customer = await getRegisterCustomerUseCase().execute({
    name,
    email,
    password,
    address,
    phone
  })
  res.status(201).json(customer)
})

customerRoutes.get('/purchases', async (req: Request, res: Response) => {
  try {
    const customerService = new CustomerService()
    const purchases = await customerService.listPurchasesByAuthenticatedCustomer(req.user!.id)

    return res.status(200).json(purchases)
  } catch (error) {
    if (error instanceof CustomerNotFoundError) {
      return res.status(400).json({ message: 'User needs be a customer' })
    }

    return res.status(500).json({ message: 'Internal server error' })
  }
})

customerRoutes.get('/reservations', async (req: Request, res: Response) => {
  try {
    const customerService = new CustomerService()
    const reservations = await customerService.listReservationsByAuthenticatedCustomer(req.user!.id)

    return res.status(200).json(reservations)
  } catch (error) {
    if (error instanceof CustomerNotFoundError) {
      return res.status(400).json({ message: 'User needs be a customer' })
    }

    return res.status(500).json({ message: 'Internal server error' })
  }
})
