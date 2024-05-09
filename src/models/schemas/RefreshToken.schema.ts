import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  _id?: ObjectId
  token: string
  user_id: ObjectId
  iat: number
  exp: number
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
  iat: Date
  exp: Date

  constructor(refreshToken: RefreshTokenType) {
    const date = new Date()
    this._id = refreshToken._id
    this.token = refreshToken.token
    this.created_at = date
    this.user_id = refreshToken.user_id
    this.iat = new Date(refreshToken.iat * 1000) // convert epoch to date
    this.exp = new Date(refreshToken.exp * 1000)
  }
}
