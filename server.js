import dotenv from 'dotenv'
import app from './src/app.js'

dotenv.config()

const port = process.env.APP_PORT

app.listen(port, () => {
  console.log(`Coding API app listening on port http://localhost:${port}`)
})