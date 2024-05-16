import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { CreateTweetReqBody } from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, CreateTweetReqBody>, res: Response) => {
  const { user_id: userId, verify } = req.decodedAccessToken as TokenPayload
  const result = await tweetsService.createTweet(req.body, userId, verify)
  return res.status(HTTP_STATUS.CREATED).json(result)
}

export const getTweetController = async (req: Request, res: Response) => {
  const tweetId = req.params.tweet_id
  let userId = ''
  if (req.decodedAccessToken) {
    userId = req.decodedAccessToken.user_id
  }
  const result = await tweetsService.getTweet(tweetId, userId)
  return res.status(HTTP_STATUS.OK).json({
    message: TWEETS_MESSAGES.GET_TWEET_SUCCESSFULLY,
    data: result
  })
}

export const getChildTweetsController = async (req: Request, res: Response) => {
  const { tweet_id: tweetId } = req.params
  const { limit, page, type } = req.query
  let limitNumber = Number(limit)
  let pageNumber = Number(page)
  let userId = ''
  if (req.decodedAccessToken) {
    userId = req.decodedAccessToken.user_id
  }
  const result = await tweetsService.getChildTweets({ tweetId, userId, limitNumber, pageNumber, type: type as string })
  return res.status(HTTP_STATUS.OK).json({
    message: TWEETS_MESSAGES.GET_TWEET_SUCCESSFULLY,
    data: {
      tweets: result.tweets,
      tweet_type: type,
      page: pageNumber,
      limit: limitNumber,
      total_page: Math.ceil(result.totalDocuments / limitNumber)
    }
  })
}

export const getFeedController = async (req: Request, res: Response) => {
  const { user_id: userId } = req.decodedAccessToken as TokenPayload
  const { limit, page } = req.query
  const result = await tweetsService.getFeed({
    limit: Number(limit),
    page: Number(page),
    userId
  })
  return res.status(HTTP_STATUS.OK).json({
    message: TWEETS_MESSAGES.GET_NEWS_FEED_SUCCESSFULLY,
    data: {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / Number(limit))
    }
  })
}
