import axios from 'axios'
import { ObjectId } from 'mongodb'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody,
  VerifyEmailReqBody,
  VerifyForgotPasswordTokenReqBody
} from '~/models/requests/User.requests'
import Follower from '~/models/schemas/Follower.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'

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
    const emailVerifyToken = await this.signEmailVerifyToken({
      userId: userId.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        _id: userId,
        ...payload,
        email_verify_token: emailVerifyToken,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        username: 'user' + userId.toString()
      })
    )

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken({
        userId: userId.toString(),
        verify: UserVerifyStatus.Unverified
      }),
      this.signRefreshToken({
        userId: userId.toString(),
        verify: UserVerifyStatus.Unverified
      })
    ])

    const { iat, exp } = await this.decodeRefreshToken(refreshToken)

    await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: userId, token: refreshToken, iat, exp }))

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
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken({
        userId: userId,
        verify: user.verify
      }),
      this.signRefreshToken({
        userId: userId,
        verify: user.verify
      })
    ])
    const { iat, exp } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(userId), token: refreshToken, iat, exp })
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
      this.signAccessToken({
        userId: userId,
        verify: UserVerifyStatus.Verified
      }),
      this.signRefreshToken({
        userId: userId,
        verify: UserVerifyStatus.Verified
      }),
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

    const { iat, exp } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(userId), token: refreshToken, iat, exp })
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

    const emailVerifyToken = await this.signEmailVerifyToken({
      userId: userId,
      verify: UserVerifyStatus.Unverified
    })

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

    const forgotPasswordToken = await this.signForgotPasswordToken({
      userId: user._id.toString(),
      verify: user.verify
    })

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

  async updateMe(payload: UpdateMeReqBody, userId: string, verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    if (payload.username) {
      const userWithUsername = await databaseService.users.findOne({ username: payload.username })
      if (userWithUsername) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS,
          status: HTTP_STATUS.CONFLICT
        })
      }
    }

    const payloadWithDateOfBirth = payload.date_of_birth
      ? { ...payload, date_of_birth: new Date(payload.date_of_birth) }
      : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...(payloadWithDateOfBirth as UpdateMeReqBody & { date_of_birth?: Date }),
          updated_at: new Date()
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
  }

  async follow(payload: FollowReqBody, userId: string, verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const { followed_user_id } = payload
    const followedUser = await databaseService.users.findOne({ _id: new ObjectId(followed_user_id) })

    if (!followedUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const existingFollow = await databaseService.followers.findOne({
      user_id: new ObjectId(userId),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (existingFollow) {
      return {
        message: USERS_MESSAGES.USER_ALREADY_FOLLOWED
      }
    }

    await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(userId),
        followed_user_id: new ObjectId(followed_user_id)
      })
    )

    return {
      message: USERS_MESSAGES.FOLLOWED_USER_SUCCESSFULLY
    }
  }

  async unfollow(followed_user_id: string, userId: string, verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const followedUser = await databaseService.users.findOne({ _id: new ObjectId(followed_user_id) })

    if (!followedUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const existingFollow = await databaseService.followers.findOne({
      user_id: new ObjectId(userId),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (!existingFollow) {
      return {
        message: USERS_MESSAGES.USER_NOT_FOLLOWED
      }
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(userId),
      followed_user_id: new ObjectId(followed_user_id)
    })

    return {
      message: USERS_MESSAGES.UNFOLLOWED_USER_SUCCESSFULLY
    }
  }

  async changePassword(payload: ChangePasswordReqBody, userId: string, verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
    const { password, new_password } = payload
    const user = await databaseService.users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (user.password !== hashPassword(password)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.OLD_PASSWORD_IS_INCORRECT,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }

    await databaseService.users.updateOne(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          password: hashPassword(new_password),
          updated_at: new Date()
        }
      }
    )

    return {
      message: USERS_MESSAGES.PASSWORD_CHANGED_SUCCESSFULLY
    }
  }

  async oAuth(code: string) {
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)
    const googleUserInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!googleUserInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_IS_NOT_VERIFIED,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    const user = await databaseService.users.findOne({ email: googleUserInfo.email })

    // if user exists, log in (not throw an error, just return the access token and refresh token)
    if (user) {
      const [accessToken, refreshToken] = await Promise.all([
        this.signAccessToken({
          userId: user._id.toString(),
          verify: user.verify
        }),
        this.signRefreshToken({
          userId: user._id.toString(),
          verify: user.verify
        })
      ])
      const { iat, exp } = await this.decodeRefreshToken(refreshToken)

      await databaseService.refreshTokens.insertOne(
        new RefreshToken({ user_id: user._id, token: refreshToken, iat, exp })
      )

      return {
        accessToken,
        refreshToken,
        newUser: false
      }
    }

    // user does not exist, register
    const userId = new ObjectId()
    const emailVerifyToken = await this.signEmailVerifyToken({
      userId: userId.toString(),
      verify: UserVerifyStatus.Unverified
    })

    // random password
    const password = Math.random().toString(36).slice(2, 15)
    await databaseService.users.insertOne(
      new User({
        _id: userId,
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        email_verify_token: emailVerifyToken,
        date_of_birth: new Date(),
        password: hashPassword(password),
        username: 'user' + userId.toString()
      })
    )

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken({
        userId: userId.toString(),
        verify: UserVerifyStatus.Unverified
      }),
      this.signRefreshToken({
        userId: userId.toString(),
        verify: UserVerifyStatus.Unverified
      })
    ])
    const { iat, exp } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: userId, token: refreshToken, iat, exp }))

    return {
      accessToken,
      refreshToken,
      newUser: true
    }
  }

  async refreshToken(payload: RefreshTokenReqBody, userId: string, exp: number) {
    const { refresh_token } = payload
    const [refreshToken, user] = await Promise.all([
      databaseService.refreshTokens.findOne({ token: refresh_token }),
      databaseService.users.findOne({ _id: new ObjectId(userId) })
    ])

    if (!refreshToken) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.REFRESH_TOKEN_USED_OR_DOES_NOT_EXIST,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const [accessToken, newRefreshToken, _] = await Promise.all([
      this.signAccessToken({
        userId: userId.toString(),
        verify: user.verify
      }),
      this.signRefreshToken({
        userId: userId.toString(),
        verify: user.verify,
        exp
      }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])

    const { iat } = await this.decodeRefreshToken(newRefreshToken)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(userId), token: newRefreshToken, iat, exp })
    )

    return {
      accessToken,
      refreshToken: newRefreshToken
    }
  }

  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(accessToken: string, idToken: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token: accessToken,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    })

    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async checkEmailExists(email: string) {
    const userWithEmail = await databaseService.users.findOne({ email })
    return Boolean(userWithEmail)
  }

  private decodeRefreshToken(refreshToken: string) {
    return verifyToken({
      token: refreshToken,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  private async signAccessToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    const accessToken = await signToken({
      payload: {
        user_id: userId,
        verify,
        token_type: TokenType.AccessToken
      },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
    return accessToken
  }

  private async signRefreshToken({ userId, verify, exp }: { userId: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      const refreshToken = await signToken({
        payload: {
          user_id: userId,
          verify,
          token_type: TokenType.RefreshToken,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
      return refreshToken
    }
    const refreshToken = await signToken({
      payload: {
        user_id: userId,
        verify,
        token_type: TokenType.RefreshToken
      },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
    return refreshToken
  }

  private async signEmailVerifyToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    const emailVerifyToken = await signToken({
      payload: {
        user_id: userId,
        verify,
        token_type: TokenType.EmailVerifyToken
      },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
    return emailVerifyToken
  }

  private async signForgotPasswordToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    const forgotPasswordToken = await signToken({
      payload: {
        user_id: userId,
        verify,
        token_type: TokenType.ForgotPasswordToken
      },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
    return forgotPasswordToken
  }
}

const usersService = new UsersService()
export default usersService
