const User = require("../models/user")
const express = require("express")
const app =express()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const fetchuser = require("../middleware/middleware")



const JWT_SECRET = "unknownproject"




// ROUTE 1: endpoint to add user into the database

app.post("/signup",async(req,res)=>{

    const {name,username,password,gender,profilePic} = req.body

    try {
        const data = await User.findOne({username})
        if(data){
            return res.status(400).json({success:false,message:"username already exist"})
        }
        
        else{
    
            const salt = await bcrypt.genSalt(10)
            const hashPass = await bcrypt.hash(password,salt)

            const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`
            const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`
    
            
            const userData = new User({
                name,
                username,
                password:hashPass,
                gender,
                profilePic: gender == "male" ? boyProfilePic : girlProfilePic
            })
            await userData.save()
            
            
            let userdata = {
                user:{
                    id:userData.id
                }
            }

            const token = jwt.sign(userdata,JWT_SECRET)
            
            
            res.json({success:true,message:"user logged in successfully",token,userData})
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error")
    }


})

// ROUTE 2 : endpoint for user login

app.post("/login",async(req,res)=>{

    const{username,password} = req.body

    try {
        let data = await User.findOne({username})
        if(!data){
            return res.status(400).json({message:"user not found",success:false})
        }
    
        let passCompare = await bcrypt.compare(password,data.password)
        if(!passCompare){
            return res.status(400).json({message:"incorrect password",success:false})
        }
    
        let userdata = {
            user:{
                id:data.id
            }
        }
    
        
        const token = jwt.sign(userdata,JWT_SECRET)
    
        res.json({success:true,token})
        
    } catch (error) {
        res.status(500).send("internal server error")
    }

})

// ROUTE 3 : to get user data

app.get("/getuser",fetchuser,async(req,res)=>{
    try {
        let data = await User.findById(req.user.id)
        res.send(data)
        
    } catch (error) {
        res.status(500).send("internal server error")
    }
})


//ROUTE 4 : Api to delete user data
app.delete("/deleteuser/:id",fetchuser,async(req,res)=>{
    let data = await User.findById(req.params.id)
    if(!data){
        return res.json({message:"No data found"})
    }
    data = await User.findByIdAndDelete(req.params.id,{new:true})
    res.json({message:"data deleted successfully"})
})

//Route 5 : Api to edit user data
app.put("/edituser/:id",fetchuser,async(req,res)=>{
    const {name,username,password} = req.body

    try {
        const newUser = {}
        if(name){
            newUser.name = name
        }
        if(username){
            newUser.username = username
        }
        if(password){
            newUser.password = password
        }
    
        let data = await User.findById(req.params.id)
        if(!data){
            return res.status(404).send("No Data Found")
        }
        if(data.user && data.user.toString() !== req.user.id){
            return res.status(404).send("Not allowed")
        }
    
        let userData = await User.findByIdAndUpdate(
            req.params.id,
            {$set:newUser},
            {new:true}
        )
        res.send(userData)
        
    } catch (error) {
        res.send("Internal server error")
    }

})


// ROUTE 6 to get all users 
app.get("/allusers",fetchuser,async(req,res)=>{
    try {
        let data = await User.find({_id: {$ne:req.user.id} }).select("-password")
        res.json(data)
    } catch (error) {
        res.status(404).send("Internal server error")
    }
})

// Search user by query

app.get("/search/:query",fetchuser, async (req, res) => {
    try {
        const searchTerm = req.params.query;
        
        const result = await User.aggregate([
            {
                $search: {
                    index: "search",
                    text: {
                        query: searchTerm,
                        path: {
                            wildcard: "*"
                        }
                    }
                }
            }
        ]);

        if(!result || result.length===0){
            return res.json({message:"User not found"})
        }

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});



module.exports = app