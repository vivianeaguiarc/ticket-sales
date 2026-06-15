export interface JwtPayload {
  id: number
  email: string
}

export interface TokenService {
  sign(payload: JwtPayload): string
}
