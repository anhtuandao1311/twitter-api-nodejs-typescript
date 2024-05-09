import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/media.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const mediaRouter = Router()

mediaRouter.post('/upload-image', accessTokenValidator, wrapRequestHandler(uploadImageController))

mediaRouter.post('/upload-video', accessTokenValidator, wrapRequestHandler(uploadVideoController))

export default mediaRouter
