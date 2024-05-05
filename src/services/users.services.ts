import { TokenType } from '~/constants/enums'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'

class UsersService {
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
  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )

    const userId = result.insertedId.toString()
    const [accessToken, refreshToken] = await Promise.all([this.signAccessToken(userId), this.signRefreshToken(userId)])

    return {
      accessToken,
      refreshToken
    }
  }

  async checkEmailExists(email: string) {
    const userWithEmail = await databaseService.users.findOne({ email })
    return Boolean(userWithEmail)
  }
}

const usersService = new UsersService()
export default usersService
