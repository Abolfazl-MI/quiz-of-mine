const { generateUserToken } = require("../../utills/functions");
const UserModel = require("../models/user_model");
const bcrypt = require("bcrypt");
class AuthController {
  async signup(req, res, next) {
    try {
      let { email, password,userName } = req.body;
        // console.log(userName)
      // try to search db if there is existing user with email
      let user = await UserModel.findOne({ $or:[
        {email},
        {userName}
      ] });
      if (user) {
        // if user exists we have to return 400 error indicates prvided email exists
        return next({
          status: 400,
          message:
            "provided email  or username has been already used,try other email or username otherwise login",
        });
      }
      // if we are here so we have not used email before we would perform the creation of user
      // firstly woul would hash user provided password
      let hashed_password = await bcrypt.hash(password, 12);
      let updatedUserName=userName.replaceAll(' ','_')
      // console.log(updatedUserName)
      let newUser=await UserModel.create({
        email,
        password:hashed_password,
        userName:updatedUserName
      });
      let token=generateUserToken(newUser._id)
      return res.status(201).json({
        statusCode: res.statusCode,
        message: "successfully created user",
        token
      });
    } catch (e) {
      return next(e);
    }
  }

  async login(req, res, next) {
    try {
      let { email, password } = req.body;
      // query user to find it
      let user = await UserModel.findOne({ email });
      //if user was not exsits so we have to raise error
      if (!user) {
        return next({
          status: 404,
          message: "User with provided email not found",
        });
      }

      // if user found we would compair provided raw pass with hashed in db
      let hashed_password = user.password;
      let compair_result = await bcrypt.compare(password, hashed_password);
      // if provided pass not mach we woudl raise 400 error ass well
      if(!compair_result){
        return next({status:400,message:'provided password is wrong'})
      }
      //after all we would generate web token for user 
      let token=generateUserToken(user._id)
      // returing response
      return res.status(200).json({
        statusCode:res.statusCode,
        message:'successfully logged in',
        token
      })
    } catch (error) {
        return next(error)
    }
  }
  async getNewToken(req,res,next){
    try{
      let {id}=req.params
      console.log(id)
      let user=await UserModel.findById(id)
      if(user){
        let token=generateUserToken(user._id)
        return res.status(200).json({
          data:[
              token,
              user
          ]
        })
      }else{
        next({status:404,message:'user not found'})
      }
    }catch(e){
      next(e)
    }
  }
}


module.exports={
    AuthController: new AuthController()
}