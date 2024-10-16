const {

    setGameInfoHashMap, addPlayerToQueue, addPlayerAndFindOpponent,
} = require("../../redis/redis_cache_service");
const {v4: uuidv4} = require("uuid");


async function gameSocketHandler(io, socket, user) {
    try {
        // try to add user to queue first if user not exists
        let gamePlayers = await addPlayerAndFindOpponent(user.email, user.level, socket.id)
        if (gamePlayers.length === 0) {
            // when error has happened
            io.of('/online').to(user.socketId).emit('server-error', 'An Unknown error happended ')

        } else if (gamePlayers.length === 1) {
            // send message to wait to find player
            io.of('/online').to(gamePlayers[0].socketId).emit('server-message', 'no opponent found yet,please wait we are trying to find one')
        } else {
            // send message to ech client the opponent found match would start
            for (let user of gamePlayers) {
                console.log('night mare finished!!! ')
                console.log('opponent found')
                io.of('/online').to(user.socketId).emit('server-message', 'An opponent found match would take place soon')
            }
        }
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    startGame: gameSocketHandler,
};
