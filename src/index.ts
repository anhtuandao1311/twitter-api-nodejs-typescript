import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { defaultErrorHandler } from '~/middlewares/error.middleware'
import bookmarksRouter from '~/routes/bookmarks.routes'
import mediaRouter from '~/routes/media.routes'
import searchRouter from '~/routes/search.routes'
import tweetsRouter from '~/routes/tweets.routes'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { initUploadFolder } from '~/utils/file'
import cors from 'cors'

const app = express()
app.use(cors())
const PORT = process.env.PORT || 4000
app.use(express.json())
databaseService.connect().then(() => {
  databaseService.generateUsersIndexes()
  databaseService.generateRefreshTokensIndexes()
  databaseService.generateFollowersIndexes()
  databaseService.generateTweetsIndexes()
})

// create upload folder
initUploadFolder()

app.use('/users', usersRouter)
app.use('/media', mediaRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/search', searchRouter)

app.use('/static/images', express.static(UPLOAD_IMAGE_DIR))
app.use('/static/videos', express.static(UPLOAD_VIDEO_DIR))
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
