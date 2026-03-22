import { app } from '../app.js'

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
  console.log('Swagger docs on http://localhost:3000/docs')
})
