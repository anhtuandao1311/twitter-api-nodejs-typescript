import { Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import searchService from '~/services/search.services'

export const searchController = async (req: Request, res: Response) => {
  const { user_id: userId } = req.decodedAccessToken as TokenPayload
  const q = req.query.q as string
  const media_type = req.query.media_type as 'video' | 'image'
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await searchService.search({ q, limit, page, userId, media_type })
  return res.status(HTTP_STATUS.OK).json({
    message: TWEETS_MESSAGES.SEARCH_TWEETS_SUCCESSFULLY,
    data: {
      tweets: result.tweets,
      q: q,
      limit: limit,
      page: page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}
