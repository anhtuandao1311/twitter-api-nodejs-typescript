import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body)
    return res.status(201).json({
      message: 'User registered successfully',
      data: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      }
    })
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to register user',
      error
    })
  }
}
