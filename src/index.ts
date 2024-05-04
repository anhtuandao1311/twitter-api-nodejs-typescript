import express from 'express'
import databaseService from '~/services/database.services'
const app = express()
app.use(express.json())
databaseService.connect()
