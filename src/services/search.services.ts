import { ObjectId } from 'mongodb'
import { MediaType } from '~/constants/enums'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'

class SearchService {
  async search({
    q,
    limit,
    page,
    userId,
    media_type
  }: {
    q: string
    limit: number
    page: number
    userId: string
    media_type?: 'video' | 'image'
  }) {
    const matchCondition: any = {
      $text: {
        $search: q
      }
    }
    if (media_type) {
      if (media_type === 'image') {
        matchCondition['media.type'] = MediaType.Image
      } else if (media_type === 'video') {
        matchCondition['media.type'] = MediaType.Video
      }
    }
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate<Tweet>([
          {
            $match: matchCondition
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(userId)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    username: '$$mention.username',
                    email: '$$mention.email'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmarks'
            }
          },
          {
            $addFields: {
              bookmark_count: {
                $size: '$bookmarks'
              }
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'child_tweets'
            }
          },
          {
            $addFields: {
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$child_tweets',
                    as: 'tweet',
                    cond: {
                      $eq: ['$$tweet.type', 1]
                    }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$child_tweets',
                    as: 'tweet',
                    cond: {
                      $eq: ['$$tweet.type', 2]
                    }
                  }
                }
              },
              quotetweet_count: {
                $size: {
                  $filter: {
                    input: '$child_tweets',
                    as: 'tweet',
                    cond: {
                      $eq: ['$$tweet.type', 3]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              child_tweets: 0,
              bookmarks: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match: matchCondition
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(userId)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])
    // skip and limit should be put right behind the last $match stage for better performance

    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId)
    const newDate = new Date()
    await databaseService.tweets.updateMany(
      {
        _id: { $in: tweet_ids }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: newDate
        }
      }
    )

    tweets.forEach((tweet) => {
      tweet.updated_at = newDate
      tweet.user_views += 1
    })

    return { tweets, total: total[0]?.total || 0 }
  }
}

const searchService = new SearchService()
export default searchService
