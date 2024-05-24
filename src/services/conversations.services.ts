import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'

class ConversationService {
  async getConversations(userId: string, receiverId: string, verify: UserVerifyStatus, limit: number, page: number) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const match = {
      $or: [
        {
          sender_id: new ObjectId(userId),
          receiver_id: new ObjectId(receiverId)
        },
        {
          sender_id: new ObjectId(receiverId),
          receiver_id: new ObjectId(userId)
        }
      ]
    }

    const conversations = await databaseService.conversations
      .find(match)
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()

    const total = await databaseService.conversations.countDocuments(match)

    return {
      conversations,
      total
    }
  }
}

const conversationService = new ConversationService()

export default conversationService
