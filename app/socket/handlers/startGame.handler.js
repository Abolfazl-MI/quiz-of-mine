const {
    addPlayerToQueue, addPlayerAndFindOpponent, setHashMap,
} = require("../../redis/redis_cache_service");
const {v4: uuidv4,} = require("uuid");
const cluster = require('cluster')

const SocketEventNames = require("../event-names");
const {Worker, isMainThread, parentPort} = require('worker_threads')
const {RoomController, GameModelController} = require("../../http/controllers/gameModelController");
const {GameRoomHandler, quizGameEventNames} = require("../../utills/quizGame");
const {SlaveHandler} = require("./slave_handler");
const {generateUserToken, generateGameJwtToken} = require("../../utills/functions");


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
                let gameInfo = await GameModelController.createGame({
                    "player_1": {
                        "id": gamePlayers[0].id,
                    },
                    "player_2": {

                        "id": gamePlayers[1].id
                    }
                })
                let gameId = gameInfo._id
                console.log('created game id is ' + gameId)

                let gameJwtToken = await generateGameJwtToken(gameId)

                _sendMessageToUsers(io, gamePlayers, SocketEventNames.SERVER_MASSAGE, {
                    "data": {
                        "token": gameJwtToken
                    }
                })
                // the slave creation and game start has moved to sapce called /quizGame
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


module.exports = {
    gameSocketHandler,
};
