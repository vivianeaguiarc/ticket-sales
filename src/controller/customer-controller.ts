import { Router } from 'express'

import { getRegisterCustomerUseCase } from '../infra/composition/identity-factory.js'

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
