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
    ],
    tags: [
      { name: 'Health', description: 'Verificação de saúde da API' },
      { name: 'Partners', description: 'Operações de parceiros' },
      { name: 'Customers', description: 'Operações de clientes' },
      { name: 'Events', description: 'Operações de eventos' },
      { name: 'Tickets', description: 'Operações de tickets' },
      { name: 'Purchases', description: 'Operações de compra' }
    ]
  },
  apis: ['./src/routes/**/*.ts', './src/main/**/*.ts', './src/app.ts']
}

export const swaggerSpec = swaggerJSDoc(swaggerOptions)
