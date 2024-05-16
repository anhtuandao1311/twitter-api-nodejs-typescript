import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { BOOKMARKS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const createBookmarkValidator = validate(
  checkSchema(
    {
      tweet_id: {
        notEmpty: {
          errorMessage: BOOKMARKS_MESSAGES.TWEET_ID_IS_REQUIRED
        },
        isString: {
          errorMessage: BOOKMARKS_MESSAGES.TWEET_ID_MUST_BE_A_STRING
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(BOOKMARKS_MESSAGES.TWEET_ID_MUST_BE_A_VALID_ID)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const unbookmarkValidator = validate(
  checkSchema(
    {
      tweet_id: {
        notEmpty: {
          errorMessage: BOOKMARKS_MESSAGES.TWEET_ID_IS_REQUIRED
        },
        isString: {
          errorMessage: BOOKMARKS_MESSAGES.TWEET_ID_MUST_BE_A_STRING
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(BOOKMARKS_MESSAGES.TWEET_ID_MUST_BE_A_VALID_ID)
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)
