import { checkSchema } from 'express-validator'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      isLength: {
        errorMessage: 'Name must be between 3 and 50 characters',
        options: {
          min: 3,
          max: 50
        }
      },
      trim: true
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        options: async (value) => {
          const isExistingEmail = await usersService.checkEmailExists(value)
          if (isExistingEmail) {
            throw new Error('Email already exists')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        errorMessage: 'Password must be between 6 and 30 characters',
        options: {
          min: 6,
          max: 30
        }
      },
      isStrongPassword: {
        errorMessage: 'Password must contain at least 6 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
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
      notEmpty: true,
      isString: true,
      isLength: {
        errorMessage: 'Password must be between 6 and 30 characters',
        options: {
          min: 6,
          max: 30
        }
      },
      isStrongPassword: {
        errorMessage: 'Password must contain at least 6 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords do not match')
          }
          return true
        }
      }
    },
    date_of_birth: {
      notEmpty: true,
      isString: true,
      isISO8601: {
        errorMessage: 'Date of birth must be a valid date',
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)
