import jwt from 'jsonwebtoken'
import { TokenPayload } from '~/models/requests/User.requests'

export function signToken({
  payload,
  privateKey,
  options
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: jwt.SignOptions
}) {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      payload,
      privateKey,
      {
        algorithm: 'HS256',
        ...options
      },
      (err, token) => {
        if (err) {
          throw reject(err)
        }
        resolve(token as string)
      }
    )
  })
}

export function verifyToken({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err, decoded) => {
      if (err) {
        return reject(err)
      }
      resolve(decoded as TokenPayload)
    })
  })
}
