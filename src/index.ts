import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { defaultErrorHandler } from '~/middlewares/error.middleware'
import mediaRouter from '~/routes/media.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { initUploadFolder } from '~/utils/file'

const app = express()
const PORT = process.env.PORT || 4000
app.use(express.json())
databaseService.connect().then(() => {
  databaseService.generateUsersIndexes()
  databaseService.generateRefreshTokensIndexes()
  databaseService.generateFollowersIndexes()
})

// create upload folder
initUploadFolder()

app.use('/users', usersRouter)
app.use('/media', mediaRouter)

app.use('/static/images', express.static(UPLOAD_IMAGE_DIR))
app.use('/static/videos', express.static(UPLOAD_VIDEO_DIR))
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
