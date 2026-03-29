import { Request, Response, Router } from 'express'

import { CustomerService } from '../services/customer-service.js'

export const purchaseRoutes = Router()

purchaseRoutes.post('/', async (req: Request, res: Response) => {
  const customerService = new CustomerService()
  const customer = await customerService.findByUserId(req.user!.id)

  if (!customer) {
    res.status(400).json({ message: 'User needs be a customer' })
    return
  }

  res.status(501).json({ message: 'Purchase service not implemented yet' })
})
