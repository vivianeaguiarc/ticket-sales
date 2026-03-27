import { Router } from 'express'

import { CustomerService } from '../services/customer-service.js'

export const customerRoutes = Router()
customerRoutes.post('/register', async (req, res) => {
  const { name, email, password, address, phone } = req.body
  const customerService = new CustomerService()
  const customer = await customerService.register({
    name,
    email,
    password,
    address,
    phone
  })
  res.status(201).json(customer)
})
