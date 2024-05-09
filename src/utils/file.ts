import { Request } from 'express'
import { File } from 'formidable'
import fs from 'fs'
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { MEDIA_MESSAGES } from '~/constants/messages'
import { EntityError } from '~/models/Errors'

export const initUploadFolder = () => {
  if (!fs.existsSync(UPLOAD_IMAGE_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_IMAGE_TEMP_DIR, { recursive: true })
  }
  if (!fs.existsSync(UPLOAD_VIDEO_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_VIDEO_TEMP_DIR, { recursive: true })
  }
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 3000KB
    maxTotalFileSize: 300 * 1024 * 4, // 3000KB * 4 = 12000KB = 12MB
    filter: function ({ name, originalFilename, mimetype }) {
      const validField = name === 'image'
      if (!validField) {
        form.emit(
          'error' as any,
          new EntityError({
            errors: {
              image: MEDIA_MESSAGES.IMAGE_IS_REQUIRED
            }
          }) as any
        )
      }

      const validMimetype = mimetype?.includes('image/')
      if (!validMimetype) {
        form.emit(
          'error' as any,
          new EntityError({
            errors: {
              image: MEDIA_MESSAGES.INVALID_FILE_TYPE
            }
          }) as any
        )
      }

      return Boolean(validField) && Boolean(validMimetype)
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        if (err.httpCode === HTTP_STATUS.CONTENT_TOO_LARGE && err.code === 1009) {
          return reject(
            new EntityError({
              errors: {
                image: MEDIA_MESSAGES.MAXIMUM_FILE_SIZE_EXCEEDED
              }
            })
          )
        }
        if (err.httpCode === HTTP_STATUS.CONTENT_TOO_LARGE && err.code === 1015) {
          return reject(
            new EntityError({
              errors: {
                image: MEDIA_MESSAGES.MAXIMUM_NUMBER_OF_FILES_EXCEEDED
              }
            })
          )
        }
        return reject(err)
      }

      // image is the name of the field in the form
      // if user does not provide image, the above filter will not check, so we need to check it here in case no image is provided

      if (!files.image) {
        return reject(
          new EntityError({
            errors: {
              image: MEDIA_MESSAGES.IMAGE_IS_REQUIRED
            }
          })
        )
      }
      resolve(files.image)
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_TEMP_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const validField = name === 'video'
      if (!validField) {
        form.emit(
          'error' as any,
          new EntityError({
            errors: {
              video: MEDIA_MESSAGES.VIDEO_IS_REQUIRED
            }
          }) as any
        )
      }

      const validMimetype = mimetype?.includes('video/')
      if (!validMimetype) {
        form.emit(
          'error' as any,
          new EntityError({
            errors: {
              video: MEDIA_MESSAGES.INVALID_FILE_TYPE
            }
          }) as any
        )
      }
      return Boolean(validField) && Boolean(validMimetype)
    }
  })

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        if (err.httpCode === HTTP_STATUS.CONTENT_TOO_LARGE && err.code === 1009) {
          return reject(
            new EntityError({
              errors: {
                video: MEDIA_MESSAGES.MAXIMUM_FILE_SIZE_EXCEEDED
              }
            })
          )
        }
        if (err.httpCode === HTTP_STATUS.CONTENT_TOO_LARGE && err.code === 1015) {
          return reject(
            new EntityError({
              errors: {
                video: MEDIA_MESSAGES.MAXIMUM_NUMBER_OF_FILES_EXCEEDED
              }
            })
          )
        }
        return reject(err)
      }

      // video is the name of the field in the form
      // if user does not provide video, the above filter will not check, so we need to check it here in case no video is provided

      if (!files.video) {
        return reject(
          new EntityError({
            errors: {
              video: MEDIA_MESSAGES.VIDEO_IS_REQUIRED
            }
          })
        )
      }
      resolve(files.video[0])
    })
  })
}

export const getFileNameWithoutExtension = (fileName: string) => {
  return fileName.replace(/\.[^/.]+$/, '')
}
