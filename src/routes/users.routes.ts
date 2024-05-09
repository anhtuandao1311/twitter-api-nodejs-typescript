import {
  changePasswordValidator,
  followValidator,
  unfollowValidator,
  updateMeValidator
} from './../middlewares/users.middlewares'
import { wrapRequestHandler } from './../utils/handlers'
import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oAuthController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))

usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))

usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordTokenController)
)

usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
)

usersRouter.get('/:username', wrapRequestHandler(getProfileController))

usersRouter.post('/follow', accessTokenValidator, followValidator, wrapRequestHandler(followController))

usersRouter.delete(
  '/follow/:followed_user_id',
  accessTokenValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

usersRouter.put(
  '/change-password',
  accessTokenValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

usersRouter.get('/oauth/google', wrapRequestHandler(oAuthController))

usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

export default usersRouter
