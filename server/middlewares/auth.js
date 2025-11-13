// //middleware to check User id and has premium plan 

// import { clerkClient,clerkMiddleware, getAuth } from "@clerk/express"

// export const auth = async(req, res,next) =>{
//     try{
//         const {userId, has} =  getAuth(req)
//         const hasPremiumPlan = await has({plan:'premium'})

//         const user = await clerkClient.users.getUser(userId)
//         if(!hasPremiumPlan && user.privateMetadata.free_usage){
//             req.free_usage = user.privateMetadata.free_usage
//         }else{
//             await clerkClient.users.updateUserMetadata(userId,{
//                 privateMetadata: {
//                     free_usage:0
//                 }
//             })
//             req.free_usage = 0

//         }
//         req.plan = hasPremiumPlan?'premium':'free'
//         next()
//     }catch(error){
//         res.json({success:false, message:error.message})
//     }
// }


//middleware to check User id and has premium plan 

import { clerkClient, getAuth } from "@clerk/express"

export const auth = async(req, res, next) => {
    try{
        const { userId } = getAuth(req)
        
        if(!userId) {
            return res.status(401).json({
                success: false, 
                message: 'Unauthorized'
            })
        }

        const user = await clerkClient.users.getUser(userId)
        const plan = user.publicMetadata?.plan || 'free'
        const hasPremiumPlan = plan === 'premium'
        
        if(!hasPremiumPlan && user.privateMetadata?.free_usage){
            req.free_usage = user.privateMetadata.free_usage
        } else if(!hasPremiumPlan) {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: 0
                }
            })
            req.free_usage = 0
        }
        
        req.plan = plan
        next()
        
    } catch(error) {
        console.error('Auth middleware error:', error)
        res.status(500).json({success: false, message: error.message})
    }
}