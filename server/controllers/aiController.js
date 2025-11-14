import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import sql from '../configs/db.js'
import { clerkClient,clerkMiddleware, getAuth } from "@clerk/express";
import { configDotenv } from "dotenv";
import { response } from "express";
import {v2 as cloudinary} from 'cloudinary'
import axios from 'axios'
import fs from "fs"
import pdf from 'pdf-parse/lib/pdf-parse.js'

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
        const {prompt} = req.body
        const plan = req.plan
        const free_usage = req.free_usage

        if(plan !=='premium' && free_usage >= 10){
            return res.json({success:false, message:'Limit reached. Upgrade to continue.'})
        }


        // console.log("testing 3")
          const response = await ai.models.generateContent({
              model: "gemini-2.0-flash",
              contents: `Generate a blog title on the given prompt: ${prompt}`,
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
        console.log("testing 1")
        const {userId} =  getAuth(req)
        const {prompt,publish} = req.body
        const plan = req.plan
        const free_usage = req.free_usage
        console.log(plan)

        // checking the plan
        if(plan !=='premium'){
            return res.json({success:false, message:'This feature is only available for premium subscriptions.'})
        }

        // clipdrop api part starts here
        const formData = new FormData()
        formData.append('prompt', prompt )
            
        const {data} = await axios.post('https://clipdrop-api.co/text-to-image/v1',formData, {
            headers:{'x-api-key': process.env.CLIPDROP_API_KEY,},
            responseType: "arraybuffer"
        })

        // console.log("testing 3")
        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`
        // console.log("testing 4")
        const {secure_url} = await cloudinary.uploader.upload(base64Image)
        // console.log("testing 5")

        //adding the content to database
        await sql`INSERT INTO creations (user_id, prompt,content, type, publish)
        VALUES(${userId},${prompt}, ${secure_url}, 'image', ${publish ?? false})`

        res.json({success:true, content:secure_url})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}
// --------------------------------------------------------------------Remove background------------------------------------------------------------
export const removeImageBackground = async(req, res) =>{
    try{
        // console.log("testing 1")
        const {userId} =  getAuth(req)
        // const {prompt,publish} = req.body
        const {image} = req.file
        const plan = req.plan
        // const free_usage = req.free_usage
        // console.log(plan)

        // checking the plan
        if(plan !=='premium'){
            return res.json({success:false, message:'This feature is only available for premium subscriptions.'})
        }

        // console.log("testing 3")
        const {secure_url} = await cloudinary.uploader.upload(image.path, {
            transformation: [{
                effect: 'background_removal',
                background_removal: 'remove_the_background'
            }]
        })
        // console.log("testing 5")

        //adding the content to database
        await sql`INSERT INTO creations (user_id, prompt,content, type)
        VALUES(${userId},'Remove background from image', ${secure_url}, 'image')`

        res.json({success:true, content:secure_url})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}

// --------------------------------------------------------------------Remove image Object------------------------------------------------------------
export const removeImageObject = async(req, res) =>{
    try{
        // console.log("testing 1")
        const {userId} =  getAuth(req)
        const {object} = req.body()
        const {image} = req.file
        const plan = req.plan


        // checking the plan
        if(plan !=='premium'){
            return res.json({success:false, message:'This feature is only available for premium subscriptions.'})
        }

        // console.log("testing 3")
        const {public_id} = await cloudinary.uploader.upload(image.path)

        const imageUrl = cloudinary.url(public_id,{
                            transformation:[{effect:`gen_remove:${object}`}],
                            resource_type:'image'
                        })

        // console.log("testing 5")

        //adding the content to database
        await sql`INSERT INTO creations (user_id, prompt,content, type)
        VALUES(${userId},${`Removed ${object} from image`}, ${imageUrl}, 'image')`

        res.json({success:true, content:imageUrl})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}
// ----------------------------------------------------------------------Resume review-------------------------------------------
export const resumeReview = async(req, res) =>{
    try{
        // console.log("testing 1")
        const {userId} =  getAuth(req)
        const resume = req.file
        const plan = req.plan


        // checking the plan
        if(plan !=='premium'){
            return res.json({success:false, message:'This feature is only available for premium subscriptions.'})
        }

        // console.log("testing 3")
        if(resume.size> 5*1024*1024){
            return res.json({success:false, message:'Resume file size exceeds allowed size (5MB)'})
        }

        const dataBuffer = fs.readFileSync(resume.path)
        const pdfData = await pdf(dataBuffer)

        const prompt = `Review the following resume and provide constructive feedback on ots strengths, weaknesses, and areas for improvement. Resume 
        Content:\n\n${pdfData.text}`

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `${prompt}`,
        });

        const content = response.text

        // console.log("testing 5")

        //adding the content to database
        await sql`INSERT INTO creations (user_id, prompt,content, type)
        VALUES(${userId},'Review the uploaded resume', ${content}, 'Resume-Review')`

        res.json({success:true, content})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}
