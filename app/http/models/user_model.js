const mongoose=require('mongoose')

const user_schema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    }, 
    password:{
        type:String,
        required:true,
    },
    userName:{
        type:String,
        required:true,
        unique:true
    },
    level:{
        type:Number,
        default:0
    }
})

const UserModel=mongoose.model('user',user_schema)

module.exports=UserModel