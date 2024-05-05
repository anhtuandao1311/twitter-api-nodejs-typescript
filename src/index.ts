import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { defaultErrorHandler } from '~/middlewares/error.middleware'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'

const app = express()
const PORT = 3000
app.use(express.json())
databaseService.connect()

app.use('/users', usersRouter)

app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
