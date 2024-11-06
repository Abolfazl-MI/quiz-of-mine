const {addPlayerToQueue, removePlayerFromQueue, setPlayerInfo, getRedisHashByKey, setHashOnRedis, isSetMember,
    createSetInRedis, updateSet, getSetAllMembersByKey
} = require("../redis/redis_cache_service");
const {Worker, isMainThread, parentPort} = require('worker_threads')
const {startGame, gameSocketHandler} = require("./handlers/startGame.handler");


const {socketAuthMiddle, gameAuthMiddleWare} = require("./middleware/socket.auth.middleware");
const {SlaveHandler} = require("./handlers/slave_handler");
const SocketEventNames = require("./event-names");

const ioMainHandler = (io) => {
    try {
        let mainAppOnlineSpace = io.of('/online')

        mainAppOnlineSpace.use(socketAuthMiddle)
        mainAppOnlineSpace.on('connection', (socket) => {
            let user = socket.user
            user.socketId = socket.id
            console.log(`an authorized user connected with email of ${user.email}`)
            gameSocketHandler(io, socket, user)
            socket.on('disconnect', (_) => {
                removePlayerFromQueue(user.email, user.level)
            })
        })
        let quizGameSpace = io.of('/quizGame')
        quizGameSpace.use(socketAuthMiddle)
        quizGameSpace.use(gameAuthMiddleWare)
        quizGameSpace.on('connection', (socket) => {
            socket.on('join-match',async (data)=>{
                let gameId=socket.gameInfo._id.toString()
                let setKey=`match:${gameId}`
                let gameMembers=await getSetAllMembersByKey(setKey)
                if(gameMembers.length<2){
                    await updateSet(setKey,socket.id)
                }
                if(gameMembers.length ===2){
                    // get users info from hashmap
                    let players=[]
                    for(let memeber of  gameMembers){
                       players.push(memeber)
                    }
                    let gameSlaveInstance= new SlaveHandler(io,players,socket.gameInfo._id.toString(),parentPort)

                }
            })
        })

    } catch (e) {
        console.log(e)
    }
};

module.exports = {
    ioMainHandler,
};
