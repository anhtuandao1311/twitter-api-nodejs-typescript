import { Router } from 'express'
import { getConversationsController } from '~/controllers/conversations.controllers'
import { getConversationsValidator } from '~/middlewares/conversations.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationRouter = Router()

conversationRouter.get(
  '/:receiver_id',
  accessTokenValidator,
  getConversationsValidator,
  wrapRequestHandler(getConversationsController)
)

export default conversationRouter
