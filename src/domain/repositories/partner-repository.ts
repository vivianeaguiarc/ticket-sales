import { Partner } from '../entities/partner.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreatePartnerData {
  userId: number
  companyName: string
}

export interface PartnerRepository {
  create(data: CreatePartnerData, options?: RepositoryQueryOptions): Promise<Partner>
  findById(id: number): Promise<Partner | null>
  findByUserId(userId: number): Promise<Partner | null>
  findAll(): Promise<Partner[]>
}
