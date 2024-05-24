import { Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { CONVERSATIONS_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import conversationService from '~/services/conversations.services'

export const getConversationsController = async (req: Request, res: Response) => {
  const { receiver_id } = req.params
  const { limit, page } = req.query
  const { user_id: userId, verify } = req.decodedAccessToken as TokenPayload
  const result = await conversationService.getConversations(userId, receiver_id, verify, Number(limit), Number(page))

  return res.status(HTTP_STATUS.OK).json({
    message: CONVERSATIONS_MESSAGES.GET_CONVERSATIONS_SUCCESSFULLY,
    data: {
      conversations: result.conversations,
      page: Number(page),
      limit: Number(limit),
      total_page: Math.ceil(result.total / Number(limit))
    }
  })
}
