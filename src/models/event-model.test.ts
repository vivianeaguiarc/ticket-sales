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

import { EventModel } from './event-model.js'
import { PartnerModel } from './partner-model.js'

describe('EventModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar um evento com sucesso usando Database.getInstance()', async () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      executeMock.mockResolvedValue([{ insertId: 1 }])

      const input = {
        partner_id: 10,
        name: 'Evento Teste',
        description: 'Descrição teste',
        date: new Date('2027-07-01T10:00:00.000Z'),
        location: 'São Paulo'
      }

      const result = await EventModel.create(input)

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO events (partner_id, name, description, date, location, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [10, 'Evento Teste', 'Descrição teste', '2027-07-01 10:00:00', 'São Paulo', createdAt]
      )

      expect(result).toBeInstanceOf(EventModel)
      expect(result.id).toBe(1)
      expect(result.partner_id).toBe(10)
      expect(result.name).toBe('Evento Teste')
      expect(result.description).toBe('Descrição teste')
      expect(result.date).toEqual(new Date('2027-07-01T10:00:00.000Z'))
      expect(result.location).toBe('São Paulo')
      expect(result.created_at).toEqual(createdAt)

      vi.useRealTimers()
    })

    test('deve criar um evento com sucesso usando connection nas options', async () => {
      const createdAt = new Date('2026-03-29T13:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const input = {
        partner_id: 20,
        name: 'Outro Evento',
        description: null as string | null,
        date: new Date('2027-08-10T15:30:00.000Z'),
        location: 'Rio de Janeiro'
      }

      const result = await EventModel.create(input, {
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO events (partner_id, name, description, date, location, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [20, 'Outro Evento', null, '2027-08-10 15:30:00', 'Rio de Janeiro', createdAt]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result.id).toBe(2)

      vi.useRealTimers()
    })
  })

  describe('findById', () => {
    test('deve retornar um evento quando encontrado sem partner', async () => {
      const row = {
        id: 1,
        partner_id: 10,
        name: 'Evento Teste',
        description: 'Descrição',
        date: new Date('2027-07-01T10:00:00.000Z'),
        location: 'São Paulo',
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await EventModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM events WHERE id = ?', [1])
      expect(result).toBeInstanceOf(EventModel)
      expect(result?.id).toBe(1)
      expect(result?.partner).toBeUndefined()
    })

    test('deve retornar null quando não encontrar evento', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await EventModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM events WHERE id = ?', [999])
      expect(result).toBeNull()
    })

    test('deve retornar um evento com partner quando options.partner for true', async () => {
      const row = {
        id: 1,
        partner_id: 10,
        name: 'Evento Teste',
        description: 'Descrição',
        date: new Date('2027-07-01T10:00:00.000Z'),
        location: 'São Paulo',
        created_at: new Date('2026-03-29T12:00:00.000Z'),
        partner_user_id: 99,
        partner_company_name: 'Minha Empresa',
        partner_created_at: new Date('2026-03-20T09:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await EventModel.findById(1, { partner: true })

      expect(executeMock).toHaveBeenCalledWith(
        `
        SELECT 
          e.*,
          p.id as partner_id,
          p.user_id as partner_user_id,
          p.company_name as partner_company_name,
          p.created_at as partner_created_at
        FROM events e
        INNER JOIN partners p ON p.id = e.partner_id
        WHERE e.id = ?
      `,
        [1]
      )

      expect(result).toBeInstanceOf(EventModel)
      expect(result?.partner).toBeInstanceOf(PartnerModel)
      expect(result?.partner?.id).toBe(10)
      expect(result?.partner?.user_id).toBe(99)
      expect(result?.partner?.company_name).toBe('Minha Empresa')
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os eventos sem filtro', async () => {
      const rows: Array<{
        id: number
        partner_id: number
        name: string
        description: string | null
        date: Date
        location: string
        created_at: Date
      }> = [
        {
          id: 1,
          partner_id: 10,
          name: 'Evento 1',
          description: null,
          date: new Date('2027-07-01T10:00:00.000Z'),
          location: 'São Paulo',
          created_at: new Date('2026-03-29T12:00:00.000Z')
        },
        {
          id: 2,
          partner_id: 20,
          name: 'Evento 2',
          description: 'Descrição',
          date: new Date('2027-08-01T10:00:00.000Z'),
          location: 'Rio de Janeiro',
          created_at: new Date('2026-03-29T13:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await EventModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM events', [])
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(EventModel)
      expect(result[1]).toBeInstanceOf(EventModel)
    })

    test('deve retornar eventos filtrando por partner_id', async () => {
      const rows = [
        {
          id: 1,
          partner_id: 10,
          name: 'Evento 1',
          description: null as string | null,
          date: new Date('2027-07-01T10:00:00.000Z'),
          location: 'São Paulo',
          created_at: new Date('2026-03-29T12:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await EventModel.findAll({
        where: { partner_id: 10 }
      })

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM events WHERE partner_id = ?', [10])
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(EventModel)
      expect(result[0].partner_id).toBe(10)
    })
  })

  describe('update', () => {
    test('deve atualizar evento com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const event = new EventModel({
        id: 1,
        partner_id: 10,
        name: 'Evento Atualizado',
        description: 'Nova descrição',
        date: new Date('2027-07-01T10:00:00.000Z'),
        location: 'São Paulo'
      })

      await event.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE events SET partner_id = ?, name = ?, description = ?, date = ?, location = ? WHERE id = ?',
        [10, 'Evento Atualizado', 'Nova descrição', '2027-07-01 10:00:00', 'São Paulo', 1]
      )
    })

    test('deve lançar erro ao tentar atualizar evento inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const event = new EventModel({
        id: 999,
        partner_id: 10,
        name: 'Evento Inexistente',
        description: null,
        date: new Date('2027-07-01T10:00:00.000Z'),
        location: 'São Paulo'
      })

      await expect(event.update()).rejects.toThrow('Event not found')
    })
  })

  describe('delete', () => {
    test('deve deletar evento com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const event = new EventModel({
        id: 1
      })

      await event.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM events WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar evento inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const event = new EventModel({
        id: 999
      })

      await expect(event.delete()).rejects.toThrow('Event not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')
      const partner = new PartnerModel({
        id: 10,
        user_id: 99,
        company_name: 'Minha Empresa',
        created_at: new Date('2026-03-20T09:00:00.000Z')
      })

      const event = new EventModel()

      event.fill({
        id: 1,
        partner_id: 10,
        name: 'Evento Teste',
        description: 'Descrição',
        date: new Date('2027-07-01T10:00:00.000Z'),
        location: 'São Paulo',
        created_at: createdAt,
        partner
      })

      expect(event.id).toBe(1)
      expect(event.partner_id).toBe(10)
      expect(event.name).toBe('Evento Teste')
      expect(event.description).toBe('Descrição')
      expect(event.date).toEqual(new Date('2027-07-01T10:00:00.000Z'))
      expect(event.location).toBe('São Paulo')
      expect(event.created_at).toEqual(createdAt)
      expect(event.partner).toBe(partner)
    })

    test('deve preencher parcialmente sem sobrescrever campos não informados', () => {
      const initialDate = new Date('2027-07-01T10:00:00.000Z')

      const event = new EventModel({
        id: 1,
        partner_id: 10,
        name: 'Evento Original',
        description: 'Descrição original',
        date: initialDate,
        location: 'São Paulo'
      })

      event.fill({
        name: 'Evento Atualizado'
      })

      expect(event.id).toBe(1)
      expect(event.partner_id).toBe(10)
      expect(event.name).toBe('Evento Atualizado')
      expect(event.description).toBe('Descrição original')
      expect(event.date).toEqual(initialDate)
      expect(event.location).toBe('São Paulo')
    })
  })
})
