import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetType } from '~/constants/enums'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [[0, 1, 2, 3]],
        errorMessage: TWEETS_MESSAGES.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [[0, 1, 2]],
        errorMessage: TWEETS_MESSAGES.INVALID_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          if (
            [TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(req.body.type) &&
            !ObjectId.isValid(value)
          ) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_ID)
          }

          if (req.body.type === TweetType.Tweet && value) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL_FOR_ORIGINAL_TWEET)
          }
          return true
        }
      }
    },
    content: {
      isString: {
        errorMessage: TWEETS_MESSAGES.CONTENT_MUST_BE_A_STRING
      },
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]

          // if type is comment,quotetweet,tweet and does not have mentions or hashtags, content is required
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(mentions) &&
            isEmpty(hashtags) &&
            !value
          ) {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_STRING)
          }

          // if type is retweet, body must not have content
          if (type === TweetType.Retweet && value) {
            throw new Error(TWEETS_MESSAGES.RETWEET_DOES_NOT_HAVE_CONTENT)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value) => {
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_ARRAY_OF_STRING)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value) => {
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_ARRAY_OF_ID)
          }
          return true
        }
      }
    },
    media: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (req.body.type === TweetType.Retweet && value.length > 0) {
            throw new Error(TWEETS_MESSAGES.RETWEET_DOES_NOT_HAVE_MEDIA)
          }
          if (
            !value.every((item: any) => {
              return typeof item.url === 'string' && [MediaType.Image, MediaType.Video].includes(item.type)
            })
          ) {
            throw new Error(TWEETS_MESSAGES.MEDIA_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)

export const getChildTweetsValidator = validate(
  checkSchema(
    {
      tweet_id: {
        isIn: {
          options: [[0, 1, 2, 3]],
          errorMessage: TWEETS_MESSAGES.INVALID_TYPE
        }
      },
      limit: {
        isNumeric: true
      },
      page: {
        isNumeric: true
      }
    },
    ['query']
  )
)

export const getFeedValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true
      },
      page: {
        isNumeric: true
      }
    },
    ['query']
  )
)
