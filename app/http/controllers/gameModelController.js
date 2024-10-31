const {GameModel} = require("../models/game_model");

class GameModelController {
    // the input should be typ of RawRoomInfo instance
    /*create game with player_1:{id,score} player_2:{id,score} _id => _id */
    async createGame(gameInfo){
       let gameId= await GameModel.create(gameInfo)
        return gameId
    }
}


module.exports={
    GameModelController: new GameModelController()
}