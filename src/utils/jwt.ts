import jwt from 'jsonwebtoken'

export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options
}: {
  payload: string | Buffer | object
  privateKey?: string
  options?: jwt.SignOptions
}) => {
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
