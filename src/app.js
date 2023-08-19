import cors from 'cors'
import express from 'express'

// Defining the Express app
const app = express()

// Enabling CORS for all request
app.use(cors())

// Use express JSON format
app.use(express.json({
    limit: '20mb',
}))

// Declaring root endpoint
app.get('/', (req, res) => {
    res.send('CODING API v1')
})

export default app