const {RoomModel} = require("../models/room_model");

class RoomController{
    // the input should be typ of RawRoomInfo instance
    async createRoom(rawRoomInfo){

        await RoomModel.create(rawRoomInfo)
    }
}


module.exports={
    RoomController: new RoomController()
}