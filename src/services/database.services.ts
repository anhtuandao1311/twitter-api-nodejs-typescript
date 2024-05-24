import { Collection, Db, MongoClient } from 'mongodb'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import { Hashtag } from '~/models/schemas/Hashtag.schema'
import { Bookmark } from '~/models/schemas/Bookmark.schema'
import Conversation from '~/models/schemas/Conversation.schema'
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter-api.mzdnixp.mongodb.net/?retryWrites=true&w=majority&appName=twitter-api`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Successfully connected to MongoDB!')
    } catch (e) {
      console.dir(e)
      throw new Error('Unable to connect to MongoDB')
    }
  }

  get users(): Collection<User> {
    return this.db.collection('users')
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('refresh_tokens')
  }

  get followers(): Collection<Follower> {
    return this.db.collection('followers')
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection('tweets')
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection('hashtags')
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection('bookmarks')
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection('conversations')
  }

  async generateUsersIndexes() {
    const isExistingIndexes = await this.users.indexExists(['email_1', 'username_1', 'email_1_password_1'])
    if (!isExistingIndexes) {
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
      this.users.createIndex({ email: 1, password: 1 }, { unique: true })
    }
  }

  async generateRefreshTokensIndexes() {
    const isExistingIndexes = await this.refreshTokens.indexExists(['token_1, exp_1'])
    if (!isExistingIndexes) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex(
        { exp: 1 },
        {
          expireAfterSeconds: 0
        }
      )
    }
  }

  async generateFollowersIndexes() {
    const isExistingIndexes = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (!isExistingIndexes) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 }, { unique: true })
    }
  }

  async generateTweetsIndexes() {
    const isExistingIndexes = await this.tweets.indexExists(['content_text'])
    if (!isExistingIndexes) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }
}

const databaseService = new DatabaseService()
export default databaseService
