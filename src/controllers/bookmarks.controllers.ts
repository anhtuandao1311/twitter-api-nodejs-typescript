import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarksService from '~/services/bookmarks.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { CreateBookmarkReqBody } from '~/models/requests/Bookmark.requests'
import { HTTP_STATUS } from '~/constants/httpStatus'

export const createBookmarkController = async (
  req: Request<ParamsDictionary, any, CreateBookmarkReqBody>,
  res: Response
) => {
  const { user_id: userId, verify } = req.decodedAccessToken as TokenPayload
  const result = await bookmarksService.createBookmark(req.body, userId, verify)
  return res.status(HTTP_STATUS.CREATED).json(result)
}

export const unbookmarkController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const { user_id: userId, verify } = req.decodedAccessToken as TokenPayload
  const result = await bookmarksService.unbookmark(tweet_id, userId, verify)
  return res.status(HTTP_STATUS.OK).json(result)
}
