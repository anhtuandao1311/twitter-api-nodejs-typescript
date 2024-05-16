import { error } from 'console'
import { checkSchema } from 'express-validator'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const searchValidator = validate(
  checkSchema(
    {
      q: {
        isString: true
      },
      limit: {
        isNumeric: true
      },
      page: {
        isNumeric: true
      },
      media_type: {
        optional: true,
        isIn: {
          options: [['video', 'image']],
          errorMessage: TWEETS_MESSAGES.MEDIA_TYPE_MUST_BE_IMAGE_OR_VIDEO
        }
      }
    },
    ['query']
  )
)
