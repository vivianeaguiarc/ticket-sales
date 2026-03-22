import swaggerJSDoc, { type Options } from 'swagger-jsdoc'

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.4',
    info: {
      title: 'Ticket Sales API',
      version: '1.0.0',
      description:
        'API REST para criação, gerenciamento e venda de ingressos para eventos por parceiros.'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local'
      }
    ]
  },
  apis: ['./src/app.ts']
}

export const swaggerSpec = swaggerJSDoc(swaggerOptions)
