import { ObjectId, WithId } from 'mongodb'
import { TweetAudience, UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { CreateTweetReqBody } from '~/models/requests/Tweet.requests'
import { Hashtag } from '~/models/schemas/Hashtag.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'

class TweetsService {
  async createTweet(payload: CreateTweetReqBody, userId: string, verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const hashtags = await this.checkAndCreateHashtags(payload.hashtags)

    await databaseService.tweets.insertOne(
      new Tweet({
        user_id: new ObjectId(userId),
        mentions: payload.mentions.map((mention) => new ObjectId(mention)),
        media: payload.media,
        parent_id: payload.parent_id ? new ObjectId(payload.parent_id) : null,
        hashtags: hashtags,
        audience: payload.audience,
        content: payload.content,
        type: payload.type
      })
    )

    return { message: TWEETS_MESSAGES.TWEET_CREATED_SUCCESSFULLY }
  }

  async getTweet(tweetId: string, userId: string) {
    const isLoggedIn = Boolean(userId)
    const [tweet] = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            _id: new ObjectId(tweetId)
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
            bookmarks: 0
          }
        }
      ])
      .toArray()

    if (!tweet) {
      throw new ErrorWithStatus({
        message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const author = await databaseService.users.findOne({ _id: tweet.user_id })

    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    if (tweet.audience === TweetAudience.TwitterCircle) {
      if (!isLoggedIn) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }

      const viewerIsInAuthorCircle = author.twitter_circle.includes(new ObjectId(userId))
      // if viewer is not in author's circle and viewer is not the author
      if (!viewerIsInAuthorCircle && !author._id.equals(userId)) {
        throw new ErrorWithStatus({
          message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }
    const inc = isLoggedIn ? { user_views: 1 } : { guest_views: 1 }
    const tweetAfterIncreaseView = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweetId)
      },
      {
        $inc: inc,
        $set: {
          updated_at: new Date()
        }
      },
      {
        returnDocument: 'after'
      }
    )
    return tweetAfterIncreaseView
  }

  async getChildTweets({
    tweetId,
    limitNumber,
    pageNumber,
    type,
    userId
  }: {
    tweetId: string
    limitNumber: number
    pageNumber: number
    type: string
    userId: string
  }) {
    const isLoggedIn = Boolean(userId)
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweetId),
            type: Number(type)
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
            bookmarks: 0
          }
        },
        {
          $skip: limitNumber * (pageNumber - 1)
        },
        {
          $limit: limitNumber
        }
      ])
      .toArray()

    const ids = tweets.map((tweet) => tweet._id as ObjectId)

    if (tweets.length === 0) {
      throw new ErrorWithStatus({
        message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const totalDocuments = await databaseService.tweets.countDocuments({
      parent_id: new ObjectId(tweetId),
      type: Number(type)
    })

    const inc = isLoggedIn ? { user_views: 1 } : { guest_views: 1 }

    const newDate = new Date()

    await databaseService.tweets.updateMany(
      {
        _id: { $in: ids }
      },
      {
        $inc: inc,
        $set: {
          updated_at: newDate
        }
      }
    )

    tweets.forEach((tweet) => {
      tweet.updated_at = newDate
      if (isLoggedIn) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })

    return { tweets, totalDocuments }
  }

  async getFeed({ limit, page, userId }: { limit: number; page: number; userId: string }) {
    const myFollows = await databaseService.followers
      .find(
        {
          user_id: new ObjectId(userId)
        },
        {
          projection: {
            followed_user_id: 1
          }
        }
      )
      .toArray()

    const ids = myFollows.map((follow) => follow.followed_user_id)
    ids.push(new ObjectId(userId)) // add my own id to the list
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate<Tweet>([
          {
            $match: {
              user_id: {
                $in: ids
              }
            }
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
            $match: {
              user_id: {
                $in: ids
              }
            }
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

  private async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = Promise.all(
      hashtags.map(async (hashtag) => {
        return await databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new Hashtag({ name: hashtag, _id: new ObjectId() }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )

    return (await hashtagDocuments).map((hashtag) => (hashtag as WithId<Hashtag>)._id)
  }
}

const tweetsService = new TweetsService()
export default tweetsService
