import { beforeEach, describe, expect, test, vi } from 'vitest'

const { executeMock, getInstanceMock } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
    getInstanceMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: getInstanceMock
    }
  }
})

import { PoolConnection } from 'mysql2/promise'

import { PartnerModel } from './partner-model.js'
import { UserModel } from './user-model.js'

describe('PartnerModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar um partner com sucesso usando Database.getInstance()', async () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await PartnerModel.create({
        user_id: 10,
        company_name: 'Minha Empresa'
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO partners (user_id, company_name, created_at) VALUES (?, ?, ?)',
        [10, 'Minha Empresa', createdAt]
      )

      expect(result).toBeInstanceOf(PartnerModel)
      expect(result.id).toBe(1)
      expect(result.user_id).toBe(10)
      expect(result.company_name).toBe('Minha Empresa')
      expect(result.created_at).toEqual(createdAt)

      vi.useRealTimers()
    })

    test('deve criar um partner com sucesso usando connection nas options', async () => {
      const createdAt = new Date('2026-03-29T13:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await PartnerModel.create(
        {
          user_id: 20,
          company_name: 'Outra Empresa'
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO partners (user_id, company_name, created_at) VALUES (?, ?, ?)',
        [20, 'Outra Empresa', createdAt]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result.id).toBe(2)

      vi.useRealTimers()
    })
  })

  describe('findById', () => {
    test('deve retornar um partner quando encontrado sem user', async () => {
      const row = {
        id: 1,
        user_id: 10,
        company_name: 'Minha Empresa',
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await PartnerModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM partners WHERE id = ?', [1])
      expect(result).toBeInstanceOf(PartnerModel)
      expect(result?.id).toBe(1)
      expect(result?.user).toBeUndefined()
    })

    test('deve retornar null quando não encontrar partner por id', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await PartnerModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM partners WHERE id = ?', [999])
      expect(result).toBeNull()
    })

    test('deve retornar um partner com user quando options.user for true', async () => {
      const row = {
        id: 1,
        user_id: 10,
        company_name: 'Minha Empresa',
        created_at: new Date('2026-03-29T12:00:00.000Z'),
        user_name: 'Viviane',
        user_email: 'viviane@email.com'
      }

      executeMock.mockResolvedValue([[row]])

      const result = await PartnerModel.findById(1, { user: true })

      expect(executeMock).toHaveBeenCalledWith(
        `
        SELECT 
          p.*, 
          users.id as user_id, 
          users.name as user_name, 
          users.email as user_email
        FROM partners p
        INNER JOIN users ON users.id = p.user_id
        WHERE p.id = ?
      `,
        [1]
      )

      expect(result).toBeInstanceOf(PartnerModel)
      expect(result?.user).toBeInstanceOf(UserModel)
      expect(result?.user?.id).toBe(10)
      expect(result?.user?.name).toBe('Viviane')
      expect(result?.user?.email).toBe('viviane@email.com')
    })
  })

  describe('findByUserId', () => {
    test('deve retornar um partner quando encontrado por userId sem user', async () => {
      const row = {
        id: 1,
        user_id: 10,
        company_name: 'Minha Empresa',
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await PartnerModel.findByUserId(10)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM partners WHERE user_id = ?', [10])
      expect(result).toBeInstanceOf(PartnerModel)
      expect(result?.id).toBe(1)
      expect(result?.user).toBeUndefined()
    })

    test('deve retornar null quando não encontrar partner por userId', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await PartnerModel.findByUserId(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM partners WHERE user_id = ?', [999])
      expect(result).toBeNull()
    })

    test('deve retornar um partner com user quando options.user for true em findByUserId', async () => {
      const row = {
        id: 1,
        user_id: 10,
        company_name: 'Minha Empresa',
        created_at: new Date('2026-03-29T12:00:00.000Z'),
        user_name: 'Viviane',
        user_email: 'viviane@email.com'
      }

      executeMock.mockResolvedValue([[row]])

      const result = await PartnerModel.findByUserId(10, { user: true })

      expect(executeMock).toHaveBeenCalledWith(
        `
        SELECT 
          p.*, 
          users.id as user_id, 
          users.name as user_name, 
          users.email as user_email
        FROM partners p
        INNER JOIN users ON users.id = p.user_id
        WHERE p.user_id = ?
      `,
        [10]
      )

      expect(result).toBeInstanceOf(PartnerModel)
      expect(result?.user).toBeInstanceOf(UserModel)
      expect(result?.user?.id).toBe(10)
      expect(result?.user?.name).toBe('Viviane')
      expect(result?.user?.email).toBe('viviane@email.com')
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os partners', async () => {
      const rows = [
        {
          id: 1,
          user_id: 10,
          company_name: 'Empresa 1',
          created_at: new Date('2026-03-29T12:00:00.000Z')
        },
        {
          id: 2,
          user_id: 20,
          company_name: 'Empresa 2',
          created_at: new Date('2026-03-29T13:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PartnerModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM partners')
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(PartnerModel)
      expect(result[1]).toBeInstanceOf(PartnerModel)
      expect(result[0].company_name).toBe('Empresa 1')
      expect(result[1].company_name).toBe('Empresa 2')
    })
  })

  describe('update', () => {
    test('deve atualizar partner com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const partner = new PartnerModel({
        id: 1,
        user_id: 10,
        company_name: 'Empresa Atualizada'
      })

      await partner.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE partners SET user_id = ?, company_name = ? WHERE id = ?',
        [10, 'Empresa Atualizada', 1]
      )
    })

    test('deve lançar erro ao tentar atualizar partner inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const partner = new PartnerModel({
        id: 999,
        user_id: 10,
        company_name: 'Empresa Inexistente'
      })

      await expect(partner.update()).rejects.toThrow('Partner not found')
    })
  })

  describe('delete', () => {
    test('deve deletar partner com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const partner = new PartnerModel({
        id: 1
      })

      await partner.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM partners WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar partner inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const partner = new PartnerModel({
        id: 999
      })

      await expect(partner.delete()).rejects.toThrow('Partner not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')
      const user = new UserModel({
        id: 10,
        name: 'Viviane',
        email: 'viviane@email.com'
      })

      const partner = new PartnerModel()

      partner.fill({
        id: 1,
        user_id: 10,
        company_name: 'Minha Empresa',
        created_at: createdAt,
        user
      })

      expect(partner.id).toBe(1)
      expect(partner.user_id).toBe(10)
      expect(partner.company_name).toBe('Minha Empresa')
      expect(partner.created_at).toEqual(createdAt)
      expect(partner.user).toBe(user)
    })

    test('deve preencher parcialmente sem sobrescrever campos não informados', () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')

      const partner = new PartnerModel({
        id: 1,
        user_id: 10,
        company_name: 'Empresa Original',
        created_at: createdAt
      })

      partner.fill({
        company_name: 'Empresa Atualizada'
      })

      expect(partner.id).toBe(1)
      expect(partner.user_id).toBe(10)
      expect(partner.company_name).toBe('Empresa Atualizada')
      expect(partner.created_at).toEqual(createdAt)
    })
  })
})
