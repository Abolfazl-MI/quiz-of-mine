const {workerData, Worker, isMainThread, threadId,} = require("worker_threads");
const path = require('path')
const {v4: uuidv4,} = require("uuid");
const {GameModelController} = require("../../http/controllers/gameModelController");
const {quizGameEventNames} = require("../../utills/quizGame");
const SocketEventNames = require("../event-names");
const {GameModel} = require("../../http/models/game_model");

/**we removed eventEmitter because we want to that slaveHandler be out main protocol in handling and communication with slave and master
 * we would seprate space for users would play in name of /quizGame the space named /online is kind of game loby where users online and not ready to play
 * for each game would have token with game id that represented that game for it uniqness
 * */

class SlaveHandler {
    // array of players which contains starter and opponent
    #gamePlayers
    #worker
    #io
    #gameId

    constructor(io, gamePlayers, gameId,parentPort) {

        this.#gamePlayers = gamePlayers;
        this.#gameId = gameId
        this.#io = io
        this.createSlave = this.createSlave.bind(this)
        this.createSlave()

    }

    createSlave() {

        try {
            if (isMainThread) {

                // when ever this class constructor trigerd means that new game should start
                // then that would mean to create quizGame schema in mongodb and generate the jwt token
                let workerFilePath = path.join(__dirname, '..', '..', '/utills/room.worker.handler.js')
                let quizTimeLimit=process.env.QUIZ_ROOM_TIME_LIMIT || 180
                let questionPerRoom=process.env.QUESTION_PER_ROOM ||9
                this.#worker = new Worker(workerFilePath, {
                    workerData: {
                        "gameId": this.#gameId.toString(),
                        quizTimeLimit,
                        questionPerRoom
                    },

                })
                this.#worker.on('message', (workerMessage) => {
                    // console.log('we got message from worker  sir!!!')
                    // console.log(workerMessage)
                    this._onMessageReceived(workerMessage)

                })
            } else {

            }
        } catch (e) {
            console.log(e)
            console.log('worker creation error ')
        }

    }

    _onMessageReceived(message) {
        let {E, D} = message
        // console.log('received message E =>'+E)
        // console.log('received message D =>'+D)
        if (E === quizGameEventNames.GAME_JWT_CREATED) {
            let {token} = D
            this._sendUsersMessage(SocketEventNames.QUIZ_GAME_MESSAGE, {'data': {token}})
        }
        if (E === quizGameEventNames.GAME_TIME_OUT || E===quizGameEventNames.QUESTION_TIME_OUT) {
            // TODO NEED TO UPDATE MONGODB STATE OF GAME
            let {message}=D
            this._onMessageReceived(SocketEventNames.QUIZ_GAME_MESSAGE,{"data":message})
        }
        if(E===quizGameEventNames.NEXT_QUESTION){
            let {data}=D
            this._sendUsersMessage(SocketEventNames.QUIZ_GAME_MESSAGE,data)
        }
    }

    _sendUsersMessage(eventType, data) {
        this.#gamePlayers.forEach((player) => {
            this.#io.of('/online').to(player.socketId).emit(eventType, data)
        })
    }
}


module.exports = {
    SlaveHandler
}