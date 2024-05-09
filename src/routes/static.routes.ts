import { Router } from 'express'
import { streamVideoController } from '~/controllers/media.controllers'

const staticRouter = Router()

staticRouter.get('/stream-video/:name', streamVideoController)

export default staticRouter
