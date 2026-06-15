import swaggerJSDoc, { type Options } from 'swagger-jsdoc'

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.4',
    info: {
      title: 'Ticket Sales API',
      version: '1.0.0',
      description:
        'API REST para criação de eventos, venda e reserva de ingressos com controle de concorrência, histórico de status e expiração automática de reservas.'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check da API e do banco de dados',
          security: [],
          responses: {
            '200': {
              description: 'API saudável e banco conectado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      database: { type: 'string', example: 'connected' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            '503': {
              description: 'Banco de dados indisponível',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'error' },
                      database: { type: 'string', example: 'disconnected' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness check para orquestradores',
          security: [],
          responses: {
            '200': {
              description: 'Aplicação pronta para receber tráfego',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ready: { type: 'boolean', example: true }
                    }
                  }
                }
              }
            },
            '503': {
              description: 'Aplicação não está pronta',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ready: { type: 'boolean', example: false }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login de usuário (partner ou customer)',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Token JWT retornado' } }
        }
      },
      '/partners/register': {
        post: {
          tags: ['Partners'],
          summary: 'Cadastro de parceiro',
          security: [],
          responses: { '201': { description: 'Parceiro criado' } }
        }
      },
      '/customers/register': {
        post: {
          tags: ['Customers'],
          summary: 'Cadastro de cliente',
          security: [],
          responses: { '201': { description: 'Cliente criado' } }
        }
      },
      '/partners/events': {
        post: {
          tags: ['Events'],
          summary: 'Criar evento (parceiro autenticado)',
          responses: { '201': { description: 'Evento criado' } }
        },
        get: {
          tags: ['Events'],
          summary: 'Listar eventos do parceiro autenticado',
          responses: { '200': { description: 'Lista de eventos' } }
        }
      },
      '/events': {
        get: {
          tags: ['Events'],
          summary: 'Listar eventos publicamente',
          security: [],
          responses: { '200': { description: 'Lista pública de eventos' } }
        }
      },
      '/partners/events/{eventId}/tickets': {
        post: {
          tags: ['Tickets'],
          summary: 'Criar tickets em lote',
          responses: { '204': { description: 'Tickets criados' } }
        },
        get: {
          tags: ['Tickets'],
          summary: 'Listar tickets do evento',
          responses: { '200': { description: 'Lista de tickets' } }
        }
      },
      '/partners/events/reservations': {
        post: {
          tags: ['Reservations'],
          summary: 'Reservar tickets (cliente autenticado)',
          responses: {
            '201': { description: 'Reserva criada' },
            '409': { description: 'Ticket indisponível' }
          }
        }
      },
      '/partners/events/purchases': {
        post: {
          tags: ['Purchases'],
          summary: 'Comprar tickets (cliente autenticado)',
          responses: {
            '201': { description: 'Compra criada' },
            '409': { description: 'Ticket indisponível' }
          }
        }
      },
      '/partners/events/purchases/{id}/cancel': {
        post: {
          tags: ['Purchases'],
          summary: 'Cancelar compra',
          responses: {
            '200': { description: 'Compra cancelada' },
            '404': { description: 'Compra não encontrada' },
            '409': { description: 'Compra já cancelada' }
          }
        }
      }
    }
  },
  apis: []
}

export const swaggerSpec = swaggerJSDoc(swaggerOptions)
