import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
const app = express()
const PORT = 3000
app.use(express.json())
databaseService.connect()

app.use('/users', usersRouter)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
