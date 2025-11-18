import express from "express"
import cors from 'cors'
import 'dotenv/config'
import { clerkClient, requireAuth, getAuth, clerkMiddleware } from '@clerk/express'
import aiRouter from "./routes/aiRoutes.js"
import connectCloudinary from "./configs/cloudinary.js"
import userRouter from "./routes/userRoutes.js"


const app = express()
await connectCloudinary()

app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

app.get('/',(req,res)=> res.send('Server is live'))

app.use(requireAuth())

app.use('/api/user', userRouter)

app.use('/api/ai', aiRouter)


const PORT = process.env.PORT || 3000

app.listen(3000,()=>{
    console.log(`Server is running on PORT: ${PORT}`)
})