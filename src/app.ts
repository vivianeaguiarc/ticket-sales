import express from 'express'
import swaggerUi from 'swagger-ui-express'

import { swaggerSpec } from './docs/swagger.js'

const app = express()

app.use(express.json())

app.get('/', (_req, res) => {
  res.send('Hello World!')
})

app.get('/events', (_req, res) => {
  res.json([{ id: 1, name: 'Tech Conference' }])
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000')
  console.log('📚 Swagger on http://localhost:3000/docs')
})
