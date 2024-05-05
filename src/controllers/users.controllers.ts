import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { LoginReqBody, LogoutReqBody, RegisterReqBody } from '~/models/requests/User.requests'
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
