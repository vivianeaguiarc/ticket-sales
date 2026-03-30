export class PaymentService {
  async processPayment(
    _customer: {
      name: string
      email: string
      address: string
      phone: string
    },
    _amount: number,
    _cardToken: string
  ): Promise<number> {
    if (_amount <= 0) {
      throw new Error('Invalid amount')
    }

    if (!_cardToken || _cardToken.length < 10) {
      throw new Error('Invalid card token')
    }

    // Simula pagamento (80% sucesso, 20% falha)
    const random = Math.random()

    if (random < 0.2) {
      throw new Error('Payment failed')
    }

    return random // mantém compatível com seu teste atual
  }
}
