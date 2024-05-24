import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import fs from 'fs'
import path from 'path'

// Create SES service object.
const sesClient = new SESClient({
  region: process.env.AWS_REGION as string,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string
  toAddresses: string | string[]
  ccAddresses?: string[]
  body: string
  subject: string
  replyToAddresses?: string[]
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  })
}

export const sendVerifyEmail = async (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: process.env.SES_FROM_ADDRESS as string,
    toAddresses: toAddress,
    body,
    subject
  })

  return sesClient.send(sendEmailCommand)
}

const verifyEmailTemplate = fs.readFileSync(path.resolve('src/templates/verify-email.html'), 'utf8')

export const sendVerifyEmailTemplate = async (toAddress: string, emailVerifyToken: string) => {
  return sendVerifyEmail(
    toAddress,
    'Verify your email',
    verifyEmailTemplate
      .replace('{{title}}', 'Please verify your email to use our service.')
      .replace('{{content}}', 'Click the button below to verify your email.')
      .replace('{{titleLink}}', 'Verify Email')
      .replace('{{link}}', `${process.env.CLIENT_URL}/verify-email?token=${emailVerifyToken}`)
  )
}

export const sendForgotPasswordTemplate = async (toAddress: string, resetPasswordToken: string) => {
  return sendVerifyEmail(
    toAddress,
    'Reset your password',
    verifyEmailTemplate
      .replace('{{title}}', 'Please reset your password.')
      .replace('{{content}}', 'Click the button below to reset your password.')
      .replace('{{titleLink}}', 'Reset Password')
      .replace('{{link}}', `${process.env.CLIENT_URL}/reset-password?token=${resetPasswordToken}`)
  )
}
