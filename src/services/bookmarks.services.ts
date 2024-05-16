import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { BOOKMARKS_MESSAGES, TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { CreateBookmarkReqBody } from '~/models/requests/Bookmark.requests'
import { Bookmark } from '~/models/schemas/Bookmark.schema'
import databaseService from '~/services/database.services'

class BookmarksService {
  async createBookmark(payload: CreateBookmarkReqBody, userId: string, verify: UserVerifyStatus) {
    const { tweet_id } = payload
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })
    if (!tweet) {
      throw new ErrorWithStatus({
        message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const bookmark = await databaseService.bookmarks.findOne({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(userId)
    })
    if (bookmark) {
      return {
        message: BOOKMARKS_MESSAGES.BOOKMARK_ALREADY_EXISTS
      }
    }

    await databaseService.bookmarks.insertOne(
      new Bookmark({ tweet_id: new ObjectId(tweet_id), user_id: new ObjectId(userId) })
    )

    return {
      message: BOOKMARKS_MESSAGES.BOOKMARK_CREATED_SUCCESSFULLY
    }
  }

  async unbookmark(tweet_id: string, userId: string, verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const existingBookmark = await databaseService.bookmarks.findOne({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(userId)
    })

    if (!existingBookmark) {
      throw new ErrorWithStatus({
        message: BOOKMARKS_MESSAGES.BOOKMARK_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.bookmarks.deleteOne({ _id: existingBookmark._id })

    return {
      message: BOOKMARKS_MESSAGES.BOOKMARK_DELETED_SUCCESSFULLY
    }
  }
}

const bookmarksService = new BookmarksService()
export default bookmarksService
