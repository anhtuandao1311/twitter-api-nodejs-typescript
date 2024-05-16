import { ObjectId } from 'mongodb'
import { TweetAudience } from '~/constants/enums'
import { Media } from '~/models/Other'
import { TweetType } from '~/constants/enums'

interface TweetconstructorType {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  content: string
  audience: TweetAudience
  parent_id: ObjectId | null
  hashtags: ObjectId[]
  mentions: ObjectId[]
  media: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}

export default class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  content: string
  audience: TweetAudience
  parent_id: ObjectId | null
  hashtags: ObjectId[]
  mentions: ObjectId[]
  media: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
  constructor(tweet: TweetconstructorType) {
    const date = new Date()
    this._id = tweet._id
    this.user_id = tweet.user_id
    this.type = tweet.type
    this.content = tweet.content
    this.audience = tweet.audience
    this.parent_id = tweet.parent_id
    this.hashtags = tweet.hashtags
    this.mentions = tweet.mentions
    this.media = tweet.media
    this.guest_views = tweet.guest_views || 0
    this.user_views = tweet.user_views || 0
    this.created_at = tweet.created_at || date
    this.updated_at = tweet.updated_at || date
  }
}
