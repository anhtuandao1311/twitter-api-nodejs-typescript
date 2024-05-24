import { File } from 'formidable'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getFileNameWithoutExtension } from '~/utils/file'
import fs from 'fs'
import { MediaType, UserVerifyStatus } from '~/constants/enums'
import { Media } from '~/models/Other'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'

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

        const uploadResult = await uploadFileToS3({
          filename: 'images/' + `${newFileName}.jpg`,
          filepath: savePath,
          contentType: mime.getType(savePath) as string
        })
        fs.unlinkSync(file.filepath)
        fs.unlinkSync(savePath)

        return {
          url: uploadResult.Location as string,
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

    const uploadResult = await uploadFileToS3({
      filename: 'videos/' + file.newFilename,
      filepath: file.filepath,
      contentType: mime.getType(file.filepath) as string
    })
    fs.unlinkSync(file.filepath)

    return {
      url: uploadResult.Location as string,
      type: MediaType.Video
    }
  }
}

const mediaService = new MediaService()

export default mediaService
