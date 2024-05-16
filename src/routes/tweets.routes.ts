import { createTweetValidator, getChildTweetsValidator, getFeedValidator } from './../middlewares/tweets.middlewares'
import { Router } from 'express'
import {
  createTweetController,
  getChildTweetsController,
  getFeedController,
  getTweetController
} from '~/controllers/tweets.controllers'
import { unbookmarkValidator } from '~/middlewares/bookmarks.middlewares'
import { accessTokenValidator, isLoggedInValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

tweetsRouter.post(
  '/create-tweet',
  accessTokenValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

tweetsRouter.get('/feed', accessTokenValidator, getFeedValidator, wrapRequestHandler(getFeedController))

tweetsRouter.get(
  '/:tweet_id',
  unbookmarkValidator,
  isLoggedInValidator(accessTokenValidator),
  wrapRequestHandler(getTweetController)
)

tweetsRouter.get(
  '/:tweet_id/child-tweets',
  unbookmarkValidator,
  isLoggedInValidator(accessTokenValidator),
  getChildTweetsValidator,
  wrapRequestHandler(getChildTweetsController)
)

export default tweetsRouter
