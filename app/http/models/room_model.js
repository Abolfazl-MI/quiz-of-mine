const mongoose = require("mongoose");
const {mongo} = require("mongoose");
const playerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    socketId: {
        type: String,
        required: true
    }
});
const room_schema = new mongoose.Schema({
    roomId: String,
    status: {
        type: String,
        enum: ['ON-GOING', "TIME_OUT", "USER-RESIGN", "FINISHED"],
        default: "ON-GOING"
    },
    player_1: playerSchema,
    player_2: playerSchema
})
const RoomModel=mongoose.model("room", room_schema)

module.exports={
    RoomModel
}