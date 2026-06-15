import {
  getRegisterPartnerUseCase,
  getSharedPartnerRepository
} from '../infra/composition/identity-factory.js'
import { toPartnerModel, toPartnerModels } from '../shared/mappers/partner-mapper.js'

export class PartnerService {
  async register(data: { name: string; email: string; password: string; company_name: string }) {
    return getRegisterPartnerUseCase().execute(data)
  }

  async findById(id: number) {
    const partner = await getSharedPartnerRepository().findById(id)

    return partner ? toPartnerModel(partner) : null
  }

  async findByUserId(userId: number) {
    const partner = await getSharedPartnerRepository().findByUserId(userId)

    return partner ? toPartnerModel(partner) : null
  }

  async findAll() {
    const partners = await getSharedPartnerRepository().findAll()

    return toPartnerModels(partners)
  }
}
