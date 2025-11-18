import { getAuth } from "@clerk/express"
import sql from "../configs/db.js"

export const getUserCreations = async(req, res) =>{
    try{
        const {userId} = getAuth(req)
        const creations = await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`

        res.json({success:true, creations})


    }catch(error){
        res.json({success:false, message:error.message})
    }
}


export const getPublishedCreations = async(req, res) =>{
    try{
        // const {userId} = getAuth(req)
        const creations = await sql`SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`

        res.json({success:true, creations})


    }catch(error){
        res.json({success:false, message:error.message})
    }
}

export const toggleLikeCreation = async(req, res) =>{
    try{
        const {userId} = getAuth(req)
        const {id} =req.body


        const [creations] = await sql`SELECT * FROM creations WHERE id=${id} `

        if(!creations){
            return res.json({success:false, message:"Creation not found"})
        }

        const currentLikes = creation.likes 
        const userIdStr = userId.toString()
        let updatedLikes
        let message

        if(currentLikes.includes(userIdStr)){
            updatedLikes = currentLikes.filter((user)=>user !== userIdStr)
            message = 'Creation Unliked'
        }else{
            updatedLikes = [...currentLikes, userIdStr]
            message = "Creation Liked"
        }

        const formattedArray = `{${updatedLikes.json(',')}}`
        await sql`UPDATE creations SET likes =${formattedArray}::text[] WEHRE id = ${id}`

        res.json({success:true, message})


    }catch(error){
        res.json({success:false, message:error.message})
    }
}


