import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { CONVERSATIONS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { validate } from '~/utils/validation'

export const getConversationsValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true
      },
      page: {
        isNumeric: true
      },
      receiver_id: {
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: CONVERSATIONS_MESSAGES.RECEIVER_ID_MUST_BE_A_VALID_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      }
    },
    ['params', 'query']
  )
)
