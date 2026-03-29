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

import { CustomerModel } from './customer-model.js'
import { UserModel } from './user-model.js'

describe('CustomerModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar um customer com sucesso usando Database.getInstance()', async () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await CustomerModel.create({
        user_id: 10,
        address: 'Rua Teste, 123',
        phone: '11999999999'
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO customers (user_id, address, phone, created_at) VALUES (?, ?, ?, ?)',
        [10, 'Rua Teste, 123', '11999999999', createdAt]
      )

      expect(result).toBeInstanceOf(CustomerModel)
      expect(result.id).toBe(1)
      expect(result.user_id).toBe(10)
      expect(result.address).toBe('Rua Teste, 123')
      expect(result.phone).toBe('11999999999')
      expect(result.created_at).toEqual(createdAt)

      vi.useRealTimers()
    })

    test('deve criar um customer com sucesso usando connection nas options', async () => {
      const createdAt = new Date('2026-03-29T13:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await CustomerModel.create(
        {
          user_id: 20,
          address: 'Av. Brasil, 500',
          phone: '11888888888'
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO customers (user_id, address, phone, created_at) VALUES (?, ?, ?, ?)',
        [20, 'Av. Brasil, 500', '11888888888', createdAt]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result.id).toBe(2)

      vi.useRealTimers()
    })
  })

  describe('findById', () => {
    test('deve retornar um customer quando encontrado sem user', async () => {
      const row = {
        id: 1,
        user_id: 10,
        address: 'Rua Teste, 123',
        phone: '11999999999',
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await CustomerModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = ?', [1])
      expect(result).toBeInstanceOf(CustomerModel)
      expect(result?.id).toBe(1)
      expect(result?.user).toBeUndefined()
    })

    test('deve retornar null quando não encontrar customer por id', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await CustomerModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = ?', [999])
      expect(result).toBeNull()
    })

    test('deve retornar um customer com user quando options.user for true', async () => {
      const row = {
        id: 1,
        user_id: 10,
        address: 'Rua Teste, 123',
        phone: '11999999999',
        created_at: new Date('2026-03-29T12:00:00.000Z'),
        user_name: 'Viviane',
        user_email: 'viviane@email.com'
      }

      executeMock.mockResolvedValue([[row]])

      const result = await CustomerModel.findById(1, { user: true })

      expect(executeMock).toHaveBeenCalledWith(
        `
        SELECT 
          c.*,
          users.id as user_id,
          users.name as user_name,
          users.email as user_email
        FROM customers c
        INNER JOIN users ON users.id = c.user_id
        WHERE c.id = ?
      `,
        [1]
      )

      expect(result).toBeInstanceOf(CustomerModel)
      expect(result?.user).toBeInstanceOf(UserModel)
      expect(result?.user?.id).toBe(10)
      expect(result?.user?.name).toBe('Viviane')
      expect(result?.user?.email).toBe('viviane@email.com')
    })
  })

  describe('findByUserId', () => {
    test('deve retornar um customer quando encontrado por userId sem user', async () => {
      const row = {
        id: 1,
        user_id: 10,
        address: 'Rua Teste, 123',
        phone: '11999999999',
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await CustomerModel.findByUserId(10)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM customers WHERE user_id = ?', [10])
      expect(result).toBeInstanceOf(CustomerModel)
      expect(result?.id).toBe(1)
      expect(result?.user).toBeUndefined()
    })

    test('deve retornar null quando não encontrar customer por userId', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await CustomerModel.findByUserId(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM customers WHERE user_id = ?', [999])
      expect(result).toBeNull()
    })

    test('deve retornar um customer com user quando options.user for true em findByUserId', async () => {
      const row = {
        id: 1,
        user_id: 10,
        address: 'Rua Teste, 123',
        phone: '11999999999',
        created_at: new Date('2026-03-29T12:00:00.000Z'),
        user_name: 'Viviane',
        user_email: 'viviane@email.com'
      }

      executeMock.mockResolvedValue([[row]])

      const result = await CustomerModel.findByUserId(10, { user: true })

      expect(executeMock).toHaveBeenCalledWith(
        `
        SELECT 
          c.*,
          users.id as user_id,
          users.name as user_name,
          users.email as user_email
        FROM customers c
        INNER JOIN users ON users.id = c.user_id
        WHERE c.user_id = ?
      `,
        [10]
      )

      expect(result).toBeInstanceOf(CustomerModel)
      expect(result?.user).toBeInstanceOf(UserModel)
      expect(result?.user?.id).toBe(10)
      expect(result?.user?.name).toBe('Viviane')
      expect(result?.user?.email).toBe('viviane@email.com')
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os customers', async () => {
      const rows = [
        {
          id: 1,
          user_id: 10,
          address: 'Rua Teste, 123',
          phone: '11999999999',
          created_at: new Date('2026-03-29T12:00:00.000Z')
        },
        {
          id: 2,
          user_id: 20,
          address: 'Av. Brasil, 500',
          phone: '11888888888',
          created_at: new Date('2026-03-29T13:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await CustomerModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM customers')
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(CustomerModel)
      expect(result[1]).toBeInstanceOf(CustomerModel)
      expect(result[0].address).toBe('Rua Teste, 123')
      expect(result[1].address).toBe('Av. Brasil, 500')
    })
  })

  describe('update', () => {
    test('deve atualizar customer com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const customer = new CustomerModel({
        id: 1,
        user_id: 10,
        address: 'Rua Atualizada, 999',
        phone: '11777777777'
      })

      await customer.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE customers SET user_id = ?, address = ?, phone = ? WHERE id = ?',
        [10, 'Rua Atualizada, 999', '11777777777', 1]
      )
    })

    test('deve lançar erro ao tentar atualizar customer inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const customer = new CustomerModel({
        id: 999,
        user_id: 10,
        address: 'Rua Inexistente',
        phone: '11000000000'
      })

      await expect(customer.update()).rejects.toThrow('Customer not found')
    })
  })

  describe('delete', () => {
    test('deve deletar customer com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const customer = new CustomerModel({
        id: 1
      })

      await customer.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM customers WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar customer inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const customer = new CustomerModel({
        id: 999
      })

      await expect(customer.delete()).rejects.toThrow('Customer not found')
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

      const customer = new CustomerModel()

      customer.fill({
        id: 1,
        user_id: 10,
        address: 'Rua Teste, 123',
        phone: '11999999999',
        created_at: createdAt,
        user
      })

      expect(customer.id).toBe(1)
      expect(customer.user_id).toBe(10)
      expect(customer.address).toBe('Rua Teste, 123')
      expect(customer.phone).toBe('11999999999')
      expect(customer.created_at).toEqual(createdAt)
      expect(customer.user).toBe(user)
    })

    test('deve preencher parcialmente sem sobrescrever campos não informados', () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')

      const customer = new CustomerModel({
        id: 1,
        user_id: 10,
        address: 'Rua Original, 100',
        phone: '11999999999',
        created_at: createdAt
      })

      customer.fill({
        address: 'Rua Atualizada, 200'
      })

      expect(customer.id).toBe(1)
      expect(customer.user_id).toBe(10)
      expect(customer.address).toBe('Rua Atualizada, 200')
      expect(customer.phone).toBe('11999999999')
      expect(customer.created_at).toEqual(createdAt)
    })
  })
})
