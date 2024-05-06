import { Request } from 'express'
import { checkSchema } from 'express-validator'
import { capitalize } from 'lodash'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_BETWEEN_6_AND_30_CHARACTERS,
          options: {
            min: 6,
            max: 30
          }
        },
        isStrongPassword: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: USERS_MESSAGES.NAME_MUST_BE_BETWEEN_3_AND_50_CHARACTERS,
          options: {
            min: 3,
            max: 50
          }
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_BETWEEN_6_AND_30_CHARACTERS,
          options: {
            min: 6,
            max: 30
          }
        },
        isStrongPassword: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_BETWEEN_6_AND_30_CHARACTERS,
          options: {
            min: 6,
            max: 30
          }
        },
        isStrongPassword: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        },
        custom: {
          options: (value: string, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.PASSWORDS_DO_NOT_MATCH)
            }
            return true
          }
        }
      },
      date_of_birth: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_IS_REQUIRED
        },
        isISO8601: {
          errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO_8601,
          options: {
            strict: true,
            strictSeparator: true
          }
        }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = (value || '').split(' ')[1]
            if (!accessToken || (value || '').split(' ')[0] !== 'Bearer') {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decodedPayload = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              ;(req as Request).decodedAccessToken = decodedPayload
              return true
            } catch (error: any) {
              throw new ErrorWithStatus({
                message: `${USERS_MESSAGES.ACCESS_TOKEN_IS_INVALID}: ${capitalize(error.message)}`,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decodedPayload = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
              })
              ;(req as Request).decodedRefreshToken = decodedPayload
              return true
            } catch (error: any) {
              throw new ErrorWithStatus({
                message: `${USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID}: ${capitalize(error.message)}`,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decodedPayload = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decodedEmailVerifyToken = decodedPayload
              return true
            } catch (error: any) {
              throw new ErrorWithStatus({
                message: `${USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID}: ${capitalize(error.message)}`,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decodedPayload = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              })
              ;(req as Request).decodedForgotPasswordToken = decodedPayload
              return true
            } catch (error: any) {
              throw new ErrorWithStatus({
                message: `${USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID}: ${capitalize(error.message)}`,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema({
    new_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_BETWEEN_6_AND_30_CHARACTERS,
        options: {
          min: 6,
          max: 30
        }
      },
      isStrongPassword: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      }
    },
    confirm_new_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_BETWEEN_6_AND_30_CHARACTERS,
        options: {
          min: 6,
          max: 30
        }
      },
      isStrongPassword: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      },
      custom: {
        options: (value: string, { req }) => {
          if (value !== req.body.new_password) {
            throw new Error(USERS_MESSAGES.PASSWORDS_DO_NOT_MATCH)
          }
          return true
        }
      }
    },
    forgot_password_token: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
      },
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          try {
            const decodedPayload = await verifyToken({
              token: value,
              secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
            })
            ;(req as Request).decodedForgotPasswordToken = decodedPayload
            return true
          } catch (error: any) {
            throw new ErrorWithStatus({
              message: `${USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID}: ${capitalize(error.message)}`,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
        }
      }
    }
  })
)
