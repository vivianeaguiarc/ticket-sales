import { beforeEach, describe, expect, test, vi } from 'vitest'

const { registerExecuteMock, findByIdMock, findByUserIdMock, findAllMock } = vi.hoisted(() => {
  return {
    registerExecuteMock: vi.fn(),
    findByIdMock: vi.fn(),
    findByUserIdMock: vi.fn(),
    findAllMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getRegisterPartnerUseCase: () => ({
      execute: registerExecuteMock
    }),
    getSharedPartnerRepository: () => ({
      findById: findByIdMock,
      findByUserId: findByUserIdMock,
      findAll: findAllMock
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

  describe('register', () => {
    test('deve registrar um partner com sucesso', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        company_name: 'Minha Empresa'
      }

      const createdAt = new Date()

      registerExecuteMock.mockResolvedValue({
        id: 10,
        name: input.name,
        userId: 1,
        company_name: input.company_name,
        createdAt
      })

      const result = await partnerService.register(input)

      expect(registerExecuteMock).toHaveBeenCalledWith(input)
      expect(result).toEqual({
        id: 10,
        name: input.name,
        userId: 1,
        company_name: input.company_name,
        createdAt
      })
    })

    test('deve propagar erro do use case', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        company_name: 'Minha Empresa'
      }

      registerExecuteMock.mockRejectedValue(new Error('User create error'))

      await expect(partnerService.register(input)).rejects.toThrow('User create error')
    })
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

  describe('findById', () => {
    test('deve buscar partner por id', async () => {
      const createdAt = new Date()
      const domainPartner = new Partner(10, 1, 'Empresa', createdAt)

      findByIdMock.mockResolvedValue(domainPartner)

      const result = await partnerService.findById(10)

      expect(findByIdMock).toHaveBeenCalledWith(10)
      expect(result).toMatchObject({
        id: 10,
        company_name: 'Empresa'
      })
    })
  })

  describe('findAll', () => {
    test('deve listar todos os partners', async () => {
      const createdAt = new Date()
      const partners = [new Partner(1, 1, 'A', createdAt), new Partner(2, 2, 'B', createdAt)]

      findAllMock.mockResolvedValue(partners)

      const result = await partnerService.findAll()

      expect(findAllMock).toHaveBeenCalled()
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ id: 1 })
      expect(result[1]).toMatchObject({ id: 2 })
    })
  })
})
