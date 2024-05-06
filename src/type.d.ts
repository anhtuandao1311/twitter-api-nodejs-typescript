import { Request } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'

declare module 'express' {
  interface Request {
    decodedAccessToken?: TokenPayload
    decodedRefreshToken?: TokenPayload
    decodedEmailVerifyToken?: TokenPayload
    decodedForgotPasswordToken?: TokenPayload
  }
}
