import { ParamsDictionary, Query } from 'express-serve-static-core'
import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '~/models/Other'

export interface CreateTweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: string | null
  hashtags: string[]
  mentions: string[]
  media: Media[]
}

export interface TweetParam extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery extends Query {
  limit: string
  page: string
  type: string
}
