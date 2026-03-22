import express from 'express'
import swaggerUi from 'swagger-ui-express'

import { swaggerSpec } from './docs/swagger.js'

const app = express()

app.use(express.json())

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verifica se a API está online
 *     responses:
 *       200:
 *         description: API online
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello, Ticket Sales API!
 */
app.get('/', (_req, res) => {
  res.send('Hello, Ticket Sales API!')
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

export { app }
