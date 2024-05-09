import { Collection, Db, MongoClient } from 'mongodb'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
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
}

const databaseService = new DatabaseService()
export default databaseService
