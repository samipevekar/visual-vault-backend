const mongoose = require("mongoose")
const imageSchema =new  mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    id:{
        type:Number,
        required:true,
        unique:true
    },
    image:{
        type:String,
        required:true
    },
    favorite:{
        type:Boolean,
        default:false,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model("images",imageSchema)