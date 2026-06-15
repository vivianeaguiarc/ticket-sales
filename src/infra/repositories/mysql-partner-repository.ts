import { Partner } from '../../domain/entities/partner.js'
import {
  CreatePartnerData,
  PartnerRepository
} from '../../domain/repositories/partner-repository.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { PartnerModel } from '../../models/partner-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function toDomainPartner(model: PartnerModel): Partner {
  return new Partner(model.id, model.user_id, model.company_name, model.created_at)
}

export class MysqlPartnerRepository implements PartnerRepository {
  async create(data: CreatePartnerData, options?: RepositoryQueryOptions): Promise<Partner> {
    const connection = resolveMysqlConnection(options?.scope)
    const partner = await PartnerModel.create(
      {
        user_id: data.userId,
        company_name: data.companyName
      },
      { connection }
    )

    return toDomainPartner(partner)
  }

  async findById(id: number): Promise<Partner | null> {
    const partner = await PartnerModel.findById(id)

    return partner ? toDomainPartner(partner) : null
  }

  async findByUserId(userId: number): Promise<Partner | null> {
    const partner = await PartnerModel.findByUserId(userId)

    return partner ? toDomainPartner(partner) : null
  }

  async findAll(): Promise<Partner[]> {
    const partners = await PartnerModel.findAll()

    return partners.map(toDomainPartner)
  }
}
