import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { verifyToken } from '~/utils/jwt'
import { capitalize } from 'lodash'
import { UserVerifyStatus } from '~/constants/enums'
import { Server } from 'socket.io'
import { TokenPayload } from '~/models/requests/User.requests'
import Conversation from '~/models/schemas/Conversation.schema'
import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import { Server as HttpServer } from 'http'
export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  })

  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const accessToken = Authorization.split(' ')[1]
    try {
      if (!accessToken || (Authorization || '').split(' ')[0] !== 'Bearer') {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      try {
        const decodedPayload = await verifyToken({
          token: accessToken,
          secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
        })

        socket.handshake.auth.decodedAuthorization = decodedPayload

        const { verify } = decodedPayload
        if (verify === UserVerifyStatus.Unverified) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
      } catch (error: any) {
        throw new ErrorWithStatus({
          message: `${USERS_MESSAGES.ACCESS_TOKEN_IS_INVALID}: ${capitalize(error.message)}`,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })

  io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`)
    const { user_id } = socket.handshake.auth.decodedAuthorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }

    socket.on('send-message', async (data) => {
      const { receiver_id, sender_id, content } = data.payload
      const receiverSocketId = users[receiver_id]?.socket_id
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id as string),
        receiver_id: new ObjectId(receiver_id as string),
        content
      })
      const result = await databaseService.conversations.insertOne(conversation)
      conversation._id = result.insertedId
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit('receive_message', { payload: conversation })
      }
    })

    socket.on('disconnect', () => {
      delete users[user_id]
      console.log(`user disconnected: ${socket.id}`)
    })
  })
}
