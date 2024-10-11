const socketAuthMiddle = require("./middleware/socket.auth.middleware");

const ioMainHandler = (io) => {
    let mainAppOnlineSpace=io.of('/online')
    mainAppOnlineSpace.use(socketAuthMiddle)
    mainAppOnlineSpace.on('connection',(socket)=>{
        let user=socket.user
        console.log(`an authorized user connected with email of ${user.email}`)
    })
};

module.exports = {
  ioMainHandler,
};
