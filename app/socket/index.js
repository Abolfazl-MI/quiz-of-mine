const { addPlayerToQueue, removePlayerFromQueue } = require("../redis/redis_cache_service");
const socketAuthMiddle = require("./middleware/socket.auth.middleware");

const ioMainHandler = (io) => {
  try{
    let mainAppOnlineSpace=io.of('/online')
    mainAppOnlineSpace.use(socketAuthMiddle)
    mainAppOnlineSpace.on('connection',(socket)=>{
        let user=socket.user
        console.log(`an authorized user connected with email of ${user.email}`)
        addPlayerToQueue(user.email,user.level,socket.id)
        socket.on('disconnect',(_)=>{
          removePlayerFromQueue(user.email,user.level)
        })
    })
  }catch(e){
    console.log(e)
  }
};

module.exports = {
  ioMainHandler,
};
