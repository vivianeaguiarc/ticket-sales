import { describe, expect, test, vi } from 'vitest'

import { PaymentService } from './payment-service.js'

describe('PaymentService', () => {
  describe('processPayment', () => {
    test('deve processar pagamento e retornar um número', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.75)

      const paymentService = new PaymentService()

      const customer = {
        name: 'Viviane',
        email: 'viviane@email.com',
        address: 'Rua A, 123',
        phone: '11999999999'
      }

      const result = await paymentService.processPayment(customer, 100, 'card_token_123')

      expect(randomSpy).toHaveBeenCalledTimes(1)
      expect(result).toBe(0.75)

      randomSpy.mockRestore()
    })

    test('deve chamar Math.random mesmo com outros dados de entrada', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9)

      const paymentService = new PaymentService()

      const customer = {
        name: 'Cliente Teste',
        email: 'cliente@email.com',
        address: 'Av. Brasil, 500',
        phone: '11888888888'
      }

      const result = await paymentService.processPayment(customer, 250, 'token_abc_123')

      expect(randomSpy).toHaveBeenCalledTimes(1)
      expect(result).toBe(0.9)

      randomSpy.mockRestore()
    })
  })
})
