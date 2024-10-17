const {

    addPlayerToQueue, addPlayerAndFindOpponent, setHashMap,
} = require("../../redis/redis_cache_service");
const {v4: uuidv4,} = require("uuid");
const {RoomModel} = require("../../http/models/room_model");


async function gameSocketHandler(io, socket, user) {
    try {
        // counts rooms in /online space
        let roomsCount = io.of('/online').adapter.rooms.size;
        console.log('room length' + roomsCount)
        // room limitation on backend on 5
        if (roomsCount < 4) {
            // let create game
            await _createRoomAndJoinUser(io, socket, user)
        } else {
            // send message rooms are crowded try later
            io.of('/online').to(user.socketId).emit('server-fill', 'Matches are in play try again later')
        }
    } catch (e) {
        console.error(e);
    }
}

async function _createRoomAndJoinUser(io, socket, user) {
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
        // create room and join users in
        let roomId = uuidv4();
        // players socket
        let player1Socket = io.of('/online').sockets.get(gamePlayers[0].socketId)
        let player2Socket = io.of('/online').sockets.get(gamePlayers[1].socketId)
        player1Socket.join(roomId)
        player2Socket.join(roomId)
        console.log('setting data in redis')
        // set time out message to redis to get the controll of time of each room creation
        await setHashMap(`room:${roomId}`, {roomId, "createdAt": new Date().toISOString()}, 30)
        // set new table in mongodb for room creation
        let roomInfo={
            roomId,
            player_1:{
                "email":gamePlayers[0].email,
                "socketId":gamePlayers[0].socketId
            },
            player_2:{
                "email":gamePlayers[1].email,
                "socketId":gamePlayers[1].socketId
            }
        }
        await  RoomModel.create(roomInfo)
    }
}


module.exports = {
    startGame: gameSocketHandler,
};
