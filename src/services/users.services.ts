import { ObjectId } from 'mongodb'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
import {
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  VerifyEmailReqBody,
  VerifyForgotPasswordTokenReqBody
} from '~/models/requests/User.requests'
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
    const userId = new ObjectId()
    const emailVerifyToken = await this.signEmailVerifyToken(userId.toString())
    await databaseService.users.insertOne(
      new User({
        _id: userId,
        ...payload,
        email_verify_token: emailVerifyToken,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )

    console.log('emailVerifyToken: ', emailVerifyToken)

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId.toString()),
      this.signRefreshToken(userId.toString())
    ])
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

  async verifyEmail(payload: VerifyEmailReqBody, userId: string) {
    const { email_verify_token } = payload
    const user = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // already verified (do not throw an error, just return a message)
    if (user.verify === UserVerifyStatus.Verified) {
      return { message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED }
    }

    // use an invalid verify token
    if (user.email_verify_token !== email_verify_token) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }

    // not verified
    const [accessToken, refreshToken, _] = await Promise.all([
      this.signAccessToken(userId),
      this.signRefreshToken(userId),
      await databaseService.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            email_verify_token: '',
            updated_at: new Date(),
            verify: UserVerifyStatus.Verified
          }
          // use the one below if you want mongodb to update the updated_at using mongodb, not the time when running the code
          // $currentDate: { updated_at: true }
        }
      )
    ])
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(userId), token: refreshToken })
    )

    return {
      message: USERS_MESSAGES.EMAIL_VERIFIED_SUCCESSFULLY,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    }
  }

  async resendVerifyEmail(userId: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (user.verify === UserVerifyStatus.Verified) {
      return { message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED }
    }

    const emailVerifyToken = await this.signEmailVerifyToken(userId)

    // update the email_verify_token field in the user document

    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          email_verify_token: emailVerifyToken,
          updated_at: new Date()
        }
      }
    )

    return {
      message: USERS_MESSAGES.RESENT_EMAIL_VERIFY_SUCCESSFULLY
    }
  }

  async forgotPassword(payload: ForgotPasswordReqBody) {
    const { email } = payload
    const user = await databaseService.users.findOne({ email })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const forgotPasswordToken = await this.signForgotPasswordToken(user._id.toString())

    await databaseService.users.updateOne(
      {
        _id: user._id
      },
      {
        $set: {
          forgot_password_token: forgotPasswordToken,
          updated_at: new Date()
        }
      }
    )

    // send an email with a link to reset the password

    return {
      message: USERS_MESSAGES.FORGOT_PASSWORD_EMAIL_SENT_SUCCESSFULLY
    }
  }

  async verifyForgotPasswordToken(payload: VerifyForgotPasswordTokenReqBody, userId: string) {
    const { forgot_password_token } = payload
    const user = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (user.forgot_password_token !== forgot_password_token) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }

    return {
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_VALID
    }
  }

  async resetPassword(payload: ResetPasswordReqBody, userId: string) {
    const { new_password } = payload
    const user = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.users.updateOne(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          password: hashPassword(new_password),
          forgot_password_token: '',
          updated_at: new Date()
        }
      }
    )

    return {
      message: USERS_MESSAGES.PASSWORD_RESET_SUCCESSFULLY
    }
  }

  async getMe(userId: string) {
    const user = await databaseService.users.findOne(
      {
        _id: new ObjectId(userId)
      },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return {
      message: USERS_MESSAGES.GET_ME_SUCCESSFULLY,
      user
    }
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
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
    return accessToken
  }

  private async signRefreshToken(userId: string) {
    const refreshToken = await signToken({
      payload: {
        user_id: userId,
        type: TokenType.RefreshToken
      },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
    return refreshToken
  }

  private async signEmailVerifyToken(userId: string) {
    const emailVerifyToken = await signToken({
      payload: {
        user_id: userId,
        type: TokenType.EmailVerifyToken
      },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
    return emailVerifyToken
  }

  private async signForgotPasswordToken(userId: string) {
    const forgotPasswordToken = await signToken({
      payload: {
        user_id: userId,
        type: TokenType.ForgotPasswordToken
      },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
    return forgotPasswordToken
  }
}

const usersService = new UsersService()
export default usersService
