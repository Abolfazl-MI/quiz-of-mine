const jwt = require("jsonwebtoken");
const UserModel = require("../../http/models/user_model");

require("dotenv").config();

async function socketAuthMiddle(socket, next) {
  console.log("socket request");
  // // get authorization headers
  let header =
    socket.handshake.headers.authorization ||
    socket.handshake.headers.Authorization;
  // // if not header exists or not start with Bearer or bearer
  if (!header || !header.startsWith("Bearer")) {
    return next({ status: 400, message: "unauthorized request" });
  }
  // // get token
  const token = header.split(" ")[1];
  //   if token miss
  if (!token) {
    return next({ status: 400, message: "unauthorized request" });
  }
  // verify token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log(err);
      return next({ status: 400, message: "unauthorized request" });
    }
    // the decoded data is the user id so
    // we get user info then pass to other side
    let user = await UserModel.findById(decoded.id);
    socket.user = user;
    return next();
  });
}

module.exports = socketAuthMiddle;
