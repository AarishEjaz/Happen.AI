import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import sql from '../configs/db.js'
import { clerkClient,clerkMiddleware, getAuth } from "@clerk/express";
import { configDotenv } from "dotenv";
import { response } from "express";

// const openai = new OpenAI({
//     apiKey: process.env.GEMINI_API_KEY
//     // baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
// });



const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export const generateArticle = async(req, res) =>{
    try{
        // console.log("testing 1")
        const {userId} =  getAuth(req)
        const {prompt, length} = req.body
        const plan = req.plan
        const free_usage = req.free_usage

        if(plan !=='premium' && free_usage >= 10){
            return res.json({success:false, message:'Limit reached. Upgrade to continue.'})
        }

        // console.log(userId)

        // const response = await openai.chat.completions.create({
        //      model: "gemini-2.0-flash",
        //      messages: [
        //          { role: "system", content: "You are a helpful assistant." },
        //          {
        //           role: "user",
        //           content: "impact of bitcoin",
        //         },
        //     ],
        //     temperature: 0.7,
        //     max_tokens: length
        // });

        // console.log("testing 3")
          const response = await ai.models.generateContent({
              model: "gemini-2.0-flash",
              contents: `Generate an article on ${prompt} in about ${length} words`,
            });
            // console.log(response.text)

            

            const content = response.text
          

        await sql`INSERT INTO creations (user_id, prompt,content, type)
        VALUES(${userId},${prompt}, ${content}, 'article' )`

        // console.log("testing 4")
          console.log(userId)

        if(plan !='premium'){
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata:{
                    free_usage: free_usage + 1
                }
            })
        }

        // console.log("testing 5")
        res.json({success:true, content})

    }catch(error){
        console.log(error)
        res.json({success:false, message:error.message})
    }
}
// ----------------------------------------BLOG TITLE ------------------------------------------------------------
export const generateBlogTitle = async(req, res) =>{
    try{
        // console.log("testing 1")
        const {userId} =  getAuth(req)
        const {prompt,publish} = req.body
        const plan = req.plan
        const free_usage = req.free_usage

        if(plan !=='premium'){
            return res.json({success:false, message:'This feature is only available for premium subscriptions.'})
        }


        // console.log("testing 3")
          const response = await ai.models.generateContent({
              model: "gemini-2.0-flash",
              contents: `${prompt}`,
            });


            

            const content = response.text
          

        await sql`INSERT INTO creations (user_id, prompt,content, type)
        VALUES(${userId},${prompt}, ${content}, 'blog-title' )`

        // console.log("testing 4")
          console.log(userId)

        if(plan !='premium'){
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata:{
                    free_usage: free_usage + 1
                }
            })
        }

        // console.log("testing 5")
        res.json({success:true, content})

    }catch(error){
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// -------------------------------------------------------Generate Image-------------------------------------------------------
export const generateImage = async(req, res) =>{
    try{
        // console.log("testing 1")
        const {userId} =  getAuth(req)
        const {prompt} = req.body
        const plan = req.plan
        const free_usage = req.free_usage

        if(plan !=='premium'){
            return res.json({success:false, message:'This feature is only available for premium subscriptions.'})
        }


        // console.log("testing 3")

        const formData = new FormData()
        formData.append('prompt', prompt )
            
        await axios.post('https://clipdrop-api.co/text-to-image/v1',formData, {
            headers:{'x-api-key': YOUR_API_KEY,},
            responseType: "arrayBuffer"
        })
        .then(response => response.arrayBuffer())
        .then(buffer => {
        // buffer here is a binary representation of the returned image
        })
          

        await sql`INSERT INTO creations (user_id, prompt,content, type)
        VALUES(${userId},${prompt}, ${content}, 'blog-title' )`

        // console.log("testing 4")
          console.log(userId)

        if(plan !='premium'){
            await clerkClient.users.updateUserMetadata(userId,{
                privateMetadata:{
                    free_usage: free_usage + 1
                }
            })
        }

        // console.log("testing 5")
        res.json({success:true, content})

    }catch(error){
        console.log(error)
        res.json({success:false, message:error.message})
    }
}
