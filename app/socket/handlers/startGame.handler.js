const {
    addPlayerToQueue, addPlayerAndFindOpponent, setHashMap,
} = require("../../redis/redis_cache_service");
const {v4: uuidv4,} = require("uuid");
const cluster = require('cluster')
const {RoomModel} = require("../../http/models/room_model");
const SocketEventNames = require("../event-names");
const {Worker, isMainThread, parentPort} = require('worker_threads')
const {RoomController} = require("../../http/controllers/room.controller");
const {GameRoomHandler, quizGameEventNames} = require("../../utills/quizGame");
const {SlaveHandler} = require("./slave_handler");


async function gameSocketHandler(io, socket, user) {
    try {
        // counts rooms in /online space
        let roomsCount = io.of('/online').adapter.rooms.size;
        console.log('room length' + roomsCount)
        // room limitation on backend on 5
        if (roomsCount < 4) {
            // let create game
            // await _createRoomAndJoinUser(io, socket, user)
            let gamePlayers = await addPlayerAndFindOpponent(user.id, user.level, socket.id)
            if (gamePlayers.length === 0) {
                // an error happened while searching for opponent
                io.of('/online').to(user.socketId).emit(SocketEventNames.SERVER_ERROR, {
                    'data': 'An Unknown error happened ',
                })
            } else if (gamePlayers.length === 1) {
                // no opponent found for user
                io.of('/online').to(gamePlayers[0].socketId).emit(SocketEventNames.IN_APP_MESSAGE, {
                    "data": 'no opponent found yet,please wait we are trying to find one'
                })
            } else {
                // we have opponents
                // notify users that we found user
                _sendMessageToUsers(io, gamePlayers, SocketEventNames.IN_APP_MESSAGE, {
                    'data': 'An opponent found match would take place soon'
                })
                let roomId = _joinUserToRooms(io, gamePlayers)
                await _storeRoomInfo(roomId, gamePlayers)
                let gameSalveInstance=new SlaveHandler(roomId)
                gameSalveInstance.on("message",message=>{
                    if(message.e===quizGameEventNames.GAME_TIME_OUT){
                        io.of('/online').to(roomId).emit(SocketEventNames.SERVER_ERROR, {
                            'data':"Game time out"
                        })
                    }
                })
            }
        } else {
            // send message rooms are crowded try later
            io.of('/online').to(user.socketId).emit(SocketEventNames.SERVER_ERROR, {
                "data": 'Matches are in play try again later'
            })
        }
    } catch (e) {
        console.error(e);
    }
}

function _sendMessageToUsers(io, gamePlayers, messageType, message) {
    for (let user of gamePlayers) {
        // sends each user message that opponent found
        io.of('/online').to(user.socketId).emit(messageType, message)
    }
}

function _joinUserToRooms(io, gamePlayers) {
    let roomId = uuidv4();
    let player1Socket = io.of('/online').sockets.get(gamePlayers[0].socketId)
    let player2Socket = io.of('/online').sockets.get(gamePlayers[1].socketId)
    player1Socket.join(roomId)
    player2Socket.join(roomId)
    return roomId
}

async function _storeRoomInfo(roomId, gamePlayers) {
    let player_1 = {
        "socketId": gamePlayers[0].socketId,
        "id": gamePlayers[0].id
    }
    let player_2 = {
        "socketId": gamePlayers[1].socketId,
        "id": gamePlayers[1].id
    }
    let roomInfo = {
        roomId,
        player_1,
        player_2
    }
    await RoomController.createRoom(roomInfo)
}


module.exports = {
    gameSocketHandler,
};
