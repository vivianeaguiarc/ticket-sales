import swaggerJSDoc, { type Options } from 'swagger-jsdoc'

import { env } from '../config/env.js'

const errorMessageSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' }
  },
  required: ['message']
} as const

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.4',
    info: {
      title: 'Ticket Sales API',
      version: '1.0.0',
      description:
        'API REST para criação de eventos, venda e reserva de ingressos com controle de concorrência, histórico de status, expiração automática de reservas e consulta de histórico do cliente autenticado.'
    },
    servers: [
      {
        url: env.apiBaseUrl,
        description: env.isProduction ? 'Produção (Render)' : 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido em POST /auth/login'
        }
      },
      schemas: {
        ErrorMessage: errorMessageSchema,
        CustomerEventSummary: {
          type: 'object',
          description: 'Dados públicos do evento (sem informações do parceiro)',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Evento Final' },
            date: { type: 'string', format: 'date-time', example: '2027-08-01T10:00:00.000Z' },
            location: { type: 'string', example: 'São Paulo' }
          },
          required: ['id', 'name', 'date', 'location']
        },
        CustomerPurchaseTicket: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 3 },
            location: { type: 'string', example: 'A1' },
            price: { type: 'number', example: 100 },
            status: {
              type: 'string',
              enum: ['available', 'reserved', 'sold'],
              example: 'sold'
            },
            event: { $ref: '#/components/schemas/CustomerEventSummary' }
          },
          required: ['id', 'location', 'price', 'status', 'event']
        },
        CustomerPurchaseHistoryItem: {
          type: 'object',
          description: 'Compra do cliente com ingressos e eventos associados',
          properties: {
            id: { type: 'integer', example: 1 },
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'error', 'cancelled'],
              example: 'paid'
            },
            total_amount: { type: 'number', example: 200 },
            purchase_date: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-15T00:00:00.000Z'
            },
            tickets: {
              type: 'array',
              items: { $ref: '#/components/schemas/CustomerPurchaseTicket' }
            }
          },
          required: ['id', 'status', 'total_amount', 'purchase_date', 'tickets']
        },
        CustomerReservationTicket: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            location: { type: 'string', example: 'A1' },
            price: { type: 'number', example: 100 },
            status: {
              type: 'string',
              enum: ['available', 'reserved', 'sold'],
              example: 'reserved'
            },
            event: { $ref: '#/components/schemas/CustomerEventSummary' }
          },
          required: ['id', 'location', 'price', 'status', 'event']
        },
        CustomerReservationHistoryItem: {
          type: 'object',
          description: 'Reserva do cliente com ingresso e evento associados',
          properties: {
            id: { type: 'integer', example: 1 },
            status: {
              type: 'string',
              enum: ['reserved', 'cancelled'],
              example: 'reserved'
            },
            reservation_date: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-15T00:00:00.000Z'
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-15T00:05:00.000Z'
            },
            ticket: { $ref: '#/components/schemas/CustomerReservationTicket' }
          },
          required: ['id', 'status', 'reservation_date', 'expires_at', 'ticket']
        }
      },
      responses: {
        Unauthorized: {
          description: 'Token ausente ou inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorMessage' },
              examples: {
                noToken: {
                  value: { message: 'No token provided' }
                },
                invalidToken: {
                  value: { message: 'Failed to authenticate token' }
                }
              }
            }
          }
        },
        NotCustomer: {
          description: 'Usuário autenticado não possui perfil de cliente',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorMessage' },
              example: { message: 'User needs be a customer' }
            }
          }
        },
        InternalServerError: {
          description: 'Erro inesperado no servidor',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorMessage' },
              example: { message: 'Internal server error' }
            }
          }
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
      '/customers/purchases': {
        get: {
          tags: ['Customers'],
          summary: 'Histórico de compras do cliente autenticado',
          description:
            'Retorna as compras do customer identificado por `req.user.id`. ' +
            'Apenas usuários com perfil de cliente podem acessar. ' +
            'Não expõe senha, dados pessoais ou compras de outros clientes. ' +
            'Retorna lista vazia quando o cliente não possui compras.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Lista de compras com tickets e eventos',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CustomerPurchaseHistoryItem' }
                  },
                  examples: {
                    withPurchases: {
                      summary: 'Cliente com compras',
                      value: [
                        {
                          id: 1,
                          status: 'paid',
                          total_amount: 200,
                          purchase_date: '2026-06-15T00:00:00.000Z',
                          tickets: [
                            {
                              id: 3,
                              location: 'A1',
                              price: 100,
                              status: 'sold',
                              event: {
                                id: 1,
                                name: 'Evento Final',
                                date: '2027-08-01T10:00:00.000Z',
                                location: 'São Paulo'
                              }
                            }
                          ]
                        }
                      ]
                    },
                    empty: {
                      summary: 'Cliente sem compras',
                      value: []
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/NotCustomer' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/customers/reservations': {
        get: {
          tags: ['Customers'],
          summary: 'Histórico de reservas do cliente autenticado',
          description:
            'Retorna as reservas do customer identificado por `req.user.id`. ' +
            'Apenas usuários com perfil de cliente podem acessar. ' +
            'Não expõe senha, dados pessoais ou reservas de outros clientes. ' +
            'Retorna lista vazia quando o cliente não possui reservas.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Lista de reservas com ticket e evento',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CustomerReservationHistoryItem' }
                  },
                  examples: {
                    withReservations: {
                      summary: 'Cliente com reservas',
                      value: [
                        {
                          id: 1,
                          status: 'reserved',
                          reservation_date: '2026-06-15T00:00:00.000Z',
                          expires_at: '2026-06-15T00:05:00.000Z',
                          ticket: {
                            id: 1,
                            location: 'A1',
                            price: 100,
                            status: 'reserved',
                            event: {
                              id: 1,
                              name: 'Evento Final',
                              date: '2027-08-01T10:00:00.000Z',
                              location: 'São Paulo'
                            }
                          }
                        }
                      ]
                    },
                    empty: {
                      summary: 'Cliente sem reservas',
                      value: []
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/NotCustomer' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalServerError' }
          }
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
