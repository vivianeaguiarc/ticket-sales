import { beforeEach, describe, expect, test, vi } from 'vitest'

const { executeMock, hashSyncMock, compareSyncMock, getInstanceMock } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
    hashSyncMock: vi.fn(),
    compareSyncMock: vi.fn(),
    getInstanceMock: vi.fn()
  }
})

vi.mock('bcrypt', () => {
  return {
    default: {
      hashSync: hashSyncMock,
      compareSync: compareSyncMock
    }
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

import { UserModel } from './user-model.js'

describe('UserModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar um usuário com sucesso usando Database.getInstance()', async () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      hashSyncMock.mockReturnValue('hashed-password')
      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await UserModel.create({
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456'
      })

      expect(hashSyncMock).toHaveBeenCalledWith('123456', 10)
      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
        ['Viviane', 'viviane@email.com', 'hashed-password', createdAt]
      )

      expect(result).toBeInstanceOf(UserModel)
      expect(result.id).toBe(1)
      expect(result.name).toBe('Viviane')
      expect(result.email).toBe('viviane@email.com')
      expect(result.password).toBe('hashed-password')
      expect(result.created_at).toEqual(createdAt)

      vi.useRealTimers()
    })

    test('deve criar um usuário com sucesso usando connection nas options', async () => {
      const createdAt = new Date('2026-03-29T13:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      hashSyncMock.mockReturnValue('hashed-password')
      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await UserModel.create(
        {
          name: 'Ana',
          email: 'ana@email.com',
          password: 'abcdef'
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(hashSyncMock).toHaveBeenCalledWith('abcdef', 10)
      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
        ['Ana', 'ana@email.com', 'hashed-password', createdAt]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result.id).toBe(2)

      vi.useRealTimers()
    })
  })

  describe('hashPassword', () => {
    test('deve gerar hash da senha', () => {
      hashSyncMock.mockReturnValue('hashed-password')

      const result = UserModel.hashPassword('123456')

      expect(hashSyncMock).toHaveBeenCalledWith('123456', 10)
      expect(result).toBe('hashed-password')
    })
  })

  describe('comparePassword', () => {
    test('deve retornar true quando a senha for válida', () => {
      compareSyncMock.mockReturnValue(true)

      const result = UserModel.comparePassword('123456', 'hashed-password')

      expect(compareSyncMock).toHaveBeenCalledWith('123456', 'hashed-password')
      expect(result).toBe(true)
    })

    test('deve retornar false quando a senha for inválida', () => {
      compareSyncMock.mockReturnValue(false)

      const result = UserModel.comparePassword('wrong-password', 'hashed-password')

      expect(compareSyncMock).toHaveBeenCalledWith('wrong-password', 'hashed-password')
      expect(result).toBe(false)
    })
  })

  describe('findById', () => {
    test('deve retornar um usuário quando encontrado', async () => {
      const row = {
        id: 1,
        name: 'Viviane',
        email: 'viviane@email.com',
        password: 'hashed-password',
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await UserModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1])
      expect(result).toBeInstanceOf(UserModel)
      expect(result?.id).toBe(1)
      expect(result?.email).toBe('viviane@email.com')
    })

    test('deve retornar null quando não encontrar usuário', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await UserModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [999])
      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    test('deve retornar um usuário quando encontrado pelo email', async () => {
      const row = {
        id: 1,
        name: 'Viviane',
        email: 'viviane@email.com',
        password: 'hashed-password',
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await UserModel.findByEmail('viviane@email.com')

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [
        'viviane@email.com'
      ])
      expect(result).toBeInstanceOf(UserModel)
      expect(result?.email).toBe('viviane@email.com')
    })

    test('deve retornar null quando não encontrar usuário pelo email', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await UserModel.findByEmail('naoexiste@email.com')

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [
        'naoexiste@email.com'
      ])
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os usuários', async () => {
      const rows = [
        {
          id: 1,
          name: 'Viviane',
          email: 'viviane@email.com',
          password: 'hashed-password-1',
          created_at: new Date('2026-03-29T12:00:00.000Z')
        },
        {
          id: 2,
          name: 'Ana',
          email: 'ana@email.com',
          password: 'hashed-password-2',
          created_at: new Date('2026-03-29T13:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await UserModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM users')
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(UserModel)
      expect(result[1]).toBeInstanceOf(UserModel)
      expect(result[0].name).toBe('Viviane')
      expect(result[1].name).toBe('Ana')
    })
  })

  describe('update', () => {
    test('deve atualizar usuário com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const user = new UserModel({
        id: 1,
        name: 'Viviane Atualizada',
        email: 'viviane@email.com',
        password: 'hashed-password'
      })

      await user.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        ['Viviane Atualizada', 'viviane@email.com', 'hashed-password', 1]
      )
    })

    test('deve lançar erro ao tentar atualizar usuário inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const user = new UserModel({
        id: 999,
        name: 'Inexistente',
        email: 'inexistente@email.com',
        password: 'hashed-password'
      })

      await expect(user.update()).rejects.toThrow('User not found')
    })
  })

  describe('delete', () => {
    test('deve deletar usuário com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const user = new UserModel({
        id: 1
      })

      await user.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar usuário inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const user = new UserModel({
        id: 999
      })

      await expect(user.delete()).rejects.toThrow('User not found')
    })
  })

  describe('fill', () => {
    test('deve preencher os campos informados', () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')

      const user = new UserModel({})

      user.fill({
        id: 1,
        name: 'Viviane',
        email: 'viviane@email.com',
        password: 'hashed-password',
        created_at: createdAt
      })

      expect(user.id).toBe(1)
      expect(user.name).toBe('Viviane')
      expect(user.email).toBe('viviane@email.com')
      expect(user.password).toBe('hashed-password')
      expect(user.created_at).toEqual(createdAt)
    })

    test('deve preencher parcialmente sem sobrescrever campos não informados', () => {
      const firstDate = new Date('2026-03-29T12:00:00.000Z')

      const user = new UserModel({
        id: 1,
        name: 'Viviane',
        email: 'viviane@email.com',
        password: 'hashed-password',
        created_at: firstDate
      })

      user.fill({
        name: 'Viviane Atualizada'
      })

      expect(user.id).toBe(1)
      expect(user.name).toBe('Viviane Atualizada')
      expect(user.email).toBe('viviane@email.com')
      expect(user.password).toBe('hashed-password')
      expect(user.created_at).toEqual(firstDate)
    })
  })
})
