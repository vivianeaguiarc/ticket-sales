import express from 'express'
import swaggerUi from 'swagger-ui-express'

import { swaggerSpec } from './docs/swagger.js'

const app = express()

app.use(express.json())

app.get('/', (_req, res) => {
  res.send('Hello World!')
})

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body
  console.log(`Login attempt with email: ${email} and password: ${password}`)
  res.send({ message: 'Login successful' })
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000')
  console.log('📚 Swagger on http://localhost:3000/docs')
})
