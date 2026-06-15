import { Router } from 'express'

import { InvalidCredentialsError } from '../domain/errors/identity-errors.js'
import { getLoginUseCase } from '../infra/composition/identity-factory.js'

export const authRoutes = Router()
authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const token = await getLoginUseCase().execute(email, password)
    res.json({ token })
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.status(401).json({ message: 'Invalid email or password' })
  }
})
