const {workerData, parentPort, Worker, isMainThread,threadId} = require("worker_threads");
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
    constructor(io, gamePlayers,gameId) {
        this.#gamePlayers = gamePlayers;
        this.#gameId=gameId
        this.#io = io
        this.createSlave=this.createSlave.bind(this)
        this.createSlave()
        console.log('game id recived is '+this.#gameId)
    }

    createSlave() {

        try {
            if (isMainThread) {
                console.info('main thread id is '+threadId)
                // when ever this class constructor trigerd means that new game should start
                // then that would mean to create quizGame schema in mongodb and generate the jwt token
                let workerFilePath = path.join(__dirname, '..', '..', '/utills/room.worker.handler.js')
                this.#worker = new Worker(workerFilePath, {
                    workerData: {
                        "gameId":this.#gameId.toString()
                    }
                })
            } else {
                console.log('worker thread id is '+ threadId)
                console.log('not in worker thread ')
                this.#worker.on('message', (workerMessage) => {
                    let {E, D} = workerMessage
                    if (E === quizGameEventNames.GAME_JWT_CREATED) {
                        gamePlayers.forEach((player) => {
                            let {token} = D
                            io.of('/online').to(player.socketId).emit(SocketEventNames.SERVER_MASSAGE, {
                                "data": {
                                    token
                                }
                            })
                        })
                    }

                })
            }
        } catch (e) {

        }

    }

}


module.exports = {
    SlaveHandler
}