import { ObjectId } from 'mongodb'
import { TokenType } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
import { LoginReqBody, LogoutReqBody, RegisterReqBody } from '~/models/requests/User.requests'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'

class UsersService {
  async register(payload: RegisterReqBody) {
    const { email } = payload
    const isExistingEmail = await usersService.checkEmailExists(email)
    if (isExistingEmail) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT
      })
    }

    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )

    const userId = result.insertedId.toString()
    const [accessToken, refreshToken] = await Promise.all([this.signAccessToken(userId), this.signRefreshToken(userId)])
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(userId), token: refreshToken })
    )

    return {
      accessToken,
      refreshToken
    }
  }

  async login(payload: LoginReqBody) {
    const { email, password } = payload
    const user = await databaseService.users.findOne({ email, password: hashPassword(password) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
    const userId = user._id.toString()
    const [accessToken, refreshToken] = await Promise.all([this.signAccessToken(userId), this.signRefreshToken(userId)])
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(userId), token: refreshToken })
    )

    return {
      accessToken,
      refreshToken
    }
  }

  async logout(payload: LogoutReqBody) {
    const { refresh_token } = payload
    const refreshToken = await databaseService.refreshTokens.findOne({ token: refresh_token })
    if (!refreshToken) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.REFRESH_TOKEN_USED_OR_DOES_NOT_EXIST,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async checkEmailExists(email: string) {
    const userWithEmail = await databaseService.users.findOne({ email })
    return Boolean(userWithEmail)
  }

  private async signAccessToken(userId: string) {
    const accessToken = await signToken({
      payload: {
        user_id: userId,
        type: TokenType.AccessToken
      },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    })
    return accessToken
  }

  private async signRefreshToken(userId: string) {
    const refreshToken = await signToken({
      payload: {
        user_id: userId,
        type: TokenType.RefreshToken
      },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    })
    return refreshToken
  }
}

const usersService = new UsersService()
export default usersService
