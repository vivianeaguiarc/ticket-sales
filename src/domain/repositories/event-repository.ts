import { Event } from '../entities/event.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreateEventData {
  partnerId: number
  name: string
  description: string | null
  date: Date
  location: string
}

export interface UpdateEventData {
  partnerId: number
  name: string
  description: string | null
  date: Date
  location: string
}

export interface EventRepository {
  create(data: CreateEventData, options?: RepositoryQueryOptions): Promise<Event>
  findById(eventId: number, options?: RepositoryQueryOptions): Promise<Event | null>
  findAll(options?: RepositoryQueryOptions): Promise<Event[]>
  findByPartnerId(partnerId: number, options?: RepositoryQueryOptions): Promise<Event[]>
  update(eventId: number, data: UpdateEventData, options?: RepositoryQueryOptions): Promise<void>
  delete(eventId: number, options?: RepositoryQueryOptions): Promise<void>
}
