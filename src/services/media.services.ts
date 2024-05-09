import { File } from 'formidable'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getFileNameWithoutExtension } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { MediaType, UserVerifyStatus } from '~/constants/enums'
import { Media } from '~/models/Other'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import { HTTP_STATUS } from '~/constants/httpStatus'

class MediaService {
  async uploadImage(files: File[], verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newFileName = getFileNameWithoutExtension(file.newFilename)
        const savePath = path.resolve(UPLOAD_IMAGE_DIR, `${newFileName}.jpg`)

        sharp.cache(false)
        await sharp(file.filepath).jpeg().toFile(savePath)
        fs.unlinkSync(file.filepath)

        return {
          url: isProduction
            ? `${process.env.HOST}/static/images/${newFileName}.jpg`
            : `http://localhost:${process.env.PORT}/static/images/${newFileName}.jpg`,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async uploadVideo(file: File, verify: UserVerifyStatus) {
    if (verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const savePath = path.resolve(UPLOAD_VIDEO_DIR, file.newFilename)
    fs.renameSync(file.filepath, savePath)

    return {
      url: isProduction
        ? `${process.env.HOST}/static/videos/${file.newFilename}`
        : `http://localhost:${process.env.PORT}/static/videos/${file.newFilename}`,
      type: MediaType.Video
    }
  }
}

const mediaService = new MediaService()

export default mediaService
