import { Partner } from '../../domain/entities/partner.js'
import { PartnerModel } from '../../models/partner-model.js'

export function toPartnerModel(partner: Partner): PartnerModel {
  return new PartnerModel({
    id: partner.id,
    user_id: partner.userId,
    company_name: partner.companyName,
    created_at: partner.createdAt
  })
}

export function toPartnerModels(partners: Partner[]): PartnerModel[] {
  return partners.map(toPartnerModel)
}
