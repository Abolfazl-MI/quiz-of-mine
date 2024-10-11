const {body}=require('express-validator')


function authenticationValidator(){
    return[
        body('userName').custom((userName,ctx)=>{
            if(!userName) throw 'username should not be empty'
            if(userName.length>20||userName.length<5) throw "username should be proper and less than 20 more than 5"
        
            return true;
        }),
        body('email').isEmail().withMessage('Invalid email address,please provide valid'),
        body('password').isStrongPassword({
            minLength:8,
            
          
        }).withMessage('provided password should min 8 at length,min 2 lowercasw min 2 numbers')
    ]
}

module.exports={
    authenticationValidator
}