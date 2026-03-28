import { Router } from 'express'

import { AuthService, InvalidCredentialsError } from '../services/auth-service.js'

export const authRoutes = Router()
authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body
  const authService = new AuthService()
  try {
    const token = await authService.login(email, password)
    res.json({ token })
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.status(401).json({ message: 'Invalid email or password' })
  }
})
