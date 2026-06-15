import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  beginTransactionMock,
  commitMock,
  rollbackMock,
  endMock,
  getConnectionMock,
  userCreateMock,
  partnerCreateMock,
  findByUserIdMock,
  findByIdMock,
  findAllMock
} = vi.hoisted(() => {
  return {
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    endMock: vi.fn(),
    getConnectionMock: vi.fn(),
    userCreateMock: vi.fn(),
    partnerCreateMock: vi.fn(),
    findByUserIdMock: vi.fn(),
    findByIdMock: vi.fn(),
    findAllMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: vi.fn(() => ({
        getConnection: getConnectionMock
      }))
    }
  }
})

vi.mock('../models/user-model.js', () => {
  return {
    UserModel: {
      create: userCreateMock
    }
  }
})

vi.mock('../models/partner-model.js', () => {
  return {
    PartnerModel: {
      create: partnerCreateMock,
      findByUserId: findByUserIdMock,
      findById: findByIdMock,
      findAll: findAllMock
    }
  }
})

import { PartnerModel } from '../models/partner-model.js'
import { PartnerService } from './partner-service.js'

describe('PartnerService', () => {
  const partnerService = new PartnerService()

  beforeEach(() => {
    vi.clearAllMocks()

    getConnectionMock.mockResolvedValue({
      beginTransaction: beginTransactionMock,
      commit: commitMock,
      rollback: rollbackMock,
      end: endMock
    })
  })

  describe('register', () => {
    test('deve registrar um partner com sucesso', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        company_name: 'Minha Empresa'
      }

      const mockUser = {
        id: 1
      }

      const mockPartner = {
        id: 10,
        created_at: new Date()
      }

      const connection = {
        beginTransaction: beginTransactionMock,
        commit: commitMock,
        rollback: rollbackMock,
        end: endMock
      }

      getConnectionMock.mockResolvedValue(connection)
      userCreateMock.mockResolvedValue(mockUser)
      partnerCreateMock.mockResolvedValue(mockPartner)

      const result = await partnerService.register(input)

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)

      expect(userCreateMock).toHaveBeenCalledWith(
        {
          name: input.name,
          email: input.email,
          password: input.password
        },
        {
          connection
        }
      )

      expect(partnerCreateMock).toHaveBeenCalledWith(
        {
          user_id: mockUser.id,
          company_name: input.company_name
        },
        {
          connection
        }
      )

      expect(commitMock).toHaveBeenCalledTimes(1)
      expect(rollbackMock).not.toHaveBeenCalled()
      expect(endMock).toHaveBeenCalledTimes(1)

      expect(result).toEqual({
        id: mockPartner.id,
        name: input.name,
        userId: mockUser.id,
        company_name: input.company_name,
        createdAt: mockPartner.created_at
      })
    })

    test('deve fazer rollback se UserModel.create lançar erro', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        company_name: 'Minha Empresa'
      }

      const error = new Error('User create error')

      const connection = {
        beginTransaction: beginTransactionMock,
        commit: commitMock,
        rollback: rollbackMock,
        end: endMock
      }

      getConnectionMock.mockResolvedValue(connection)
      userCreateMock.mockRejectedValue(error)

      await expect(partnerService.register(input)).rejects.toThrow('User create error')

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)

      expect(userCreateMock).toHaveBeenCalledWith(
        {
          name: input.name,
          email: input.email,
          password: input.password
        },
        {
          connection
        }
      )

      expect(partnerCreateMock).not.toHaveBeenCalled()
      expect(commitMock).not.toHaveBeenCalled()
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(endMock).toHaveBeenCalledTimes(1)
    })

    test('deve fazer rollback se PartnerModel.create lançar erro', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        company_name: 'Minha Empresa'
      }

      const mockUser = {
        id: 1
      }

      const error = new Error('Partner create error')

      const connection = {
        beginTransaction: beginTransactionMock,
        commit: commitMock,
        rollback: rollbackMock,
        end: endMock
      }

      getConnectionMock.mockResolvedValue(connection)
      userCreateMock.mockResolvedValue(mockUser)
      partnerCreateMock.mockRejectedValue(error)

      await expect(partnerService.register(input)).rejects.toThrow('Partner create error')

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)

      expect(userCreateMock).toHaveBeenCalledWith(
        {
          name: input.name,
          email: input.email,
          password: input.password
        },
        {
          connection
        }
      )

      expect(partnerCreateMock).toHaveBeenCalledWith(
        {
          user_id: mockUser.id,
          company_name: input.company_name
        },
        {
          connection
        }
      )

      expect(commitMock).not.toHaveBeenCalled()
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(endMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('findByUserId', () => {
    test('deve buscar partner por userId com sucesso', async () => {
      const mockPartner = {
        id: 10,
        user_id: 1,
        company_name: 'Minha Empresa'
      }

      findByUserIdMock.mockResolvedValue(mockPartner)

      const result = await partnerService.findByUserId(1)

      expect(PartnerModel.findByUserId).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockPartner)
    })
  })

  describe('findById', () => {
    test('deve buscar partner por id', async () => {
      const mockPartner = { id: 10, company_name: 'Empresa' }

      findByIdMock.mockResolvedValue(mockPartner)

      const result = await partnerService.findById(10)

      expect(PartnerModel.findById).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockPartner)
    })
  })

  describe('findAll', () => {
    test('deve listar todos os partners', async () => {
      const partners = [{ id: 1 }, { id: 2 }]

      findAllMock.mockResolvedValue(partners)

      const result = await partnerService.findAll()

      expect(PartnerModel.findAll).toHaveBeenCalled()
      expect(result).toEqual(partners)
    })
  })
})
