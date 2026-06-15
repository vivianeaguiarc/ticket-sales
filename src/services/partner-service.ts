import { getSharedPartnerRepository } from '../infra/composition/identity-factory.js'
import { toPartnerModel } from '../shared/mappers/partner-mapper.js'

export class PartnerService {
  async findByUserId(userId: number) {
    const partner = await getSharedPartnerRepository().findByUserId(userId)

    return partner ? toPartnerModel(partner) : null
  }
}
