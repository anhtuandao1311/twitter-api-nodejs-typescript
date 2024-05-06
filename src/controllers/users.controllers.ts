import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import {
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  VerifyEmailReqBody,
  VerifyForgotPasswordTokenReqBody
} from '~/models/requests/User.requests'
import usersService from '~/services/users.services'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)
  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTERED_SUCCESSFULLY,
    data: {
      access_token: result.accessToken,
      refresh_token: result.refreshToken
    }
  })
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const result = await usersService.login(req.body)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGGED_IN_SUCCESSFULLY,
    data: {
      access_token: result.accessToken,
      refresh_token: result.refreshToken
    }
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  await usersService.logout(req.body)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGGED_OUT_SUCCESSFULLY
  })
}

export const emailVerifyController = async (req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response) => {
  const { user_id: userId } = req.decodedEmailVerifyToken as TokenPayload
  const result = await usersService.verifyEmail(req.body, userId)
  return res.status(HTTP_STATUS.OK).json(result)
}

export const resendEmailVerifyController = async (req: Request<ParamsDictionary, any, {}>, res: Response) => {
  const { user_id: userId } = req.decodedAccessToken as TokenPayload
  const result = await usersService.resendVerifyEmail(userId)
  return res.status(HTTP_STATUS.OK).json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const result = await usersService.forgotPassword(req.body)
  return res.status(HTTP_STATUS.OK).json(result)
}

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenReqBody>,
  res: Response
) => {
  const { user_id: userId } = req.decodedForgotPasswordToken as TokenPayload
  const result = await usersService.verifyForgotPasswordToken(req.body, userId)
  return res.status(HTTP_STATUS.OK).json(result)
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id: userId } = req.decodedForgotPasswordToken as TokenPayload
  const result = await usersService.resetPassword(req.body, userId)
  return res.status(HTTP_STATUS.OK).json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id: userId } = req.decodedAccessToken as TokenPayload
  const result = await usersService.getMe(userId)
  return res.status(HTTP_STATUS.OK).json(result)
}
