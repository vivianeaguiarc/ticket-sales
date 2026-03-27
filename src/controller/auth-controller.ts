import { Router } from 'express'

import { AuthService } from '../services/auth-service.js'

export const authRoutes = Router()
authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body
  const authService = new AuthService()
  const token = await authService.login(email, password)
  res.json({ token })
})
