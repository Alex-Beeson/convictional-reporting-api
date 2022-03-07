require('dotenv').config()

const express = require('express')
const app = express()

app.use(express.json())

const reportsRouter = require('./routes/reports') 


app.use('/reports/', reportsRouter)


app.listen(3000, () => console.log('Server Started'))