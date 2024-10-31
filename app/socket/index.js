const {addPlayerToQueue, removePlayerFromQueue} = require("../redis/redis_cache_service");
const {startGame, gameSocketHandler} = require("./handlers/startGame.handler");


const {socketAuthMiddle, gameAuthMiddleWare} = require("./middleware/socket.auth.middleware");

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
        quizGameSpace.use(gameAuthMiddleWare)
        quizGameSpace.on('connection', (socket) => {
            console.log('a player joined to private rooms of quiz game ')
        })

    } catch (e) {
        console.log(e)
    }
};

module.exports = {
    ioMainHandler,
};
