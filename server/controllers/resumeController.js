

import { GoogleGenAI } from "@google/genai";
import sql from '../configs/db.js'
import { getAuth } from "@clerk/express";
import fs from "fs"
import pdf from "pdf-parse-new"


const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);


export const resRew = async(req, res) =>{
    try{
        const { userId } = getAuth(req)
        const resume = req.file
        const plan = req.plan

        if(resume.size>5*1024*1024){
            return res.json({success:false, message:"Resume file size exceeds 5MB"})
        }
        
        const dataBuffer = fs.readFileSync(resume.path)
        console.log("testing 1")
        
        // ✅ Use dynamic import approach
        var pdfinfo
        pdf(dataBuffer).then(function(data){
            pdfinfo = data
        
        })
        
        const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses , and areas for inprovement. Resume Content: \n\n${pdfinfo} `

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `${prompt}`,
        });

        const content = response.text

        await sql`INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, 'Review the uploaded resume',${content},'Resume-Review' )`

        res.json({success:true, content})

    }catch(error){
        console.log("Error details:", error)
        console.log(error.message)
        res.json({success:false, message: error.message})
    }
}