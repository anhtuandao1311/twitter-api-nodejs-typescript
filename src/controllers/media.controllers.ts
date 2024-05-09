import { Request, Response } from 'express'
import path from 'path'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { MEDIA_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import mediaService from '~/services/media.services'
import { handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import mime from 'mime'

export const uploadImageController = async (req: Request, res: Response) => {
  const { verify } = req.decodedAccessToken as TokenPayload
  const files = await handleUploadImage(req)
  const result = await mediaService.uploadImage(files, verify)
  return res.status(HTTP_STATUS.OK).json({
    message: MEDIA_MESSAGES.IMAGE_UPLOADED_SUCCESSFULLY,
    data: result
  })
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const { verify } = req.decodedAccessToken as TokenPayload
  const file = await handleUploadVideo(req)
  const result = await mediaService.uploadVideo(file, verify)
  return res.status(HTTP_STATUS.OK).json({
    message: MEDIA_MESSAGES.VIDEO_UPLOADED_SUCCESSFULLY,
    data: result
  })
}

export const streamVideoController = async (req: Request, res: Response) => {
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send({
      message: 'Range is required'
    })
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)

  const videoSize = fs.statSync(videoPath).size
  const chunkSize = 10 ** 6 // 1MB
  const start = Number(range.replace(/\D/g, ''))
  const end = Math.min(start + chunkSize, videoSize - 1)

  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }

  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
