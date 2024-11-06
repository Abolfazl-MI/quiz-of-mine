const jwt = require("jsonwebtoken");
const UserModel = require("../../http/models/user_model");
const {GameModel} = require("../../http/models/game_model");
const {findUserHashMapById} = require("../../redis/redis_cache_service");

require("dotenv").config();

async function socketAuthMiddle(socket, next) {
    console.log("socket request");
    // // get authorization headers
    let header =
        socket.handshake.headers.authorization ||
        socket.handshake.headers.Authorization;
    // // if not header exists or not start with Bearer or bearer
    if (!header || !header.startsWith("Bearer")) {
        return next({status: 400, message: "unauthorized request"});
    }
    // // get token
    const token = header.split(" ")[1];
    //   if token miss
    if (!token) {
        return next({status: 400, message: "unauthorized request"});
    }
    // verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.log(err);
            return next({status: 400, message: "unauthorized request"});
        }
        // the decoded data is the user id so
        // we get user info then pass to other side
        let user = await UserModel.findById(decoded.id);
        socket.user = user;
        return next();
    });
}

async function gameAuthMiddleWare(socket, next) {
 let headers=socket.handshake.headers.gametoken||socket.handshake.headers.GameToken;

    if (!headers || !headers.startsWith("Bearer")) {
        return next({status: 400, message: "unauthorized request"});
    }
    const token = headers.split(" ")[1];
    if (!token) {
        return next({status: 400, message: "unauthorized request"});
    }
    jwt.verify(
        token,process.env.JWT_SECRET,async (err,decoded)=>{
            if (err) {
                console.log(err);
                return next({status: 400, message: "unauthorized request"});
            }
            let gameInfo= await GameModel.findById(decoded.id)
            // read user info from pervious middleware to check if requester in game or not
            let userId=socket.user._id.toString()
            let player_1ID=gameInfo.player_1.id.toString()
            let player_2ID=gameInfo.player_2.id.toString()
            if(userId===player_1ID||userId===player_2ID){
                socket.gameInfo=gameInfo
                return next();
            }else{
                return next({status: 400, message: "unauthorized request"});
            }

        }
    )
}

module.exports = {socketAuthMiddle,gameAuthMiddleWare};
