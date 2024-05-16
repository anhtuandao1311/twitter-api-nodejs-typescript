import { Router } from 'express'
import { createBookmarkController, unbookmarkController } from '~/controllers/bookmarks.controllers'
import { createBookmarkValidator, unbookmarkValidator } from '~/middlewares/bookmarks.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()

bookmarksRouter.post(
  '/create-bookmark',
  accessTokenValidator,
  createBookmarkValidator,
  wrapRequestHandler(createBookmarkController)
)

bookmarksRouter.delete(
  '/unbookmark/:tweet_id',
  accessTokenValidator,
  unbookmarkValidator,
  wrapRequestHandler(unbookmarkController)
)

export default bookmarksRouter
