import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByUserIdMock } = vi.hoisted(() => {
  return {
    findByUserIdMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getSharedPartnerRepository: () => ({
      findByUserId: findByUserIdMock
    })
  }
})

import { Partner } from '../domain/entities/partner.js'
import { PartnerService } from './partner-service.js'

describe('PartnerService', () => {
  const partnerService = new PartnerService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findByUserId', () => {
    test('deve buscar partner por userId com sucesso', async () => {
      const createdAt = new Date()
      const domainPartner = new Partner(10, 1, 'Minha Empresa', createdAt)

      findByUserIdMock.mockResolvedValue(domainPartner)

      const result = await partnerService.findByUserId(1)

      expect(findByUserIdMock).toHaveBeenCalledWith(1)
      expect(result).toMatchObject({
        id: 10,
        user_id: 1,
        company_name: 'Minha Empresa'
      })
    })
  })
})
