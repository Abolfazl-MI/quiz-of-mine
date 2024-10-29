const mongoose = require("mongoose");
const {mongo} = require("mongoose");
const playerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },

});
const room_schema = new mongoose.Schema({
    roomId: {
        type:String,
        required:true
    },
    status: {
        type: String,
        enum: ['ON-GOING', "TIME_OUT", "USER-RESIGN", "FINISHED"],
        default: "ON-GOING"
    },
    player_1: {
        type:playerSchema,
        required:true
    },
    player_2: {
        type:playerSchema,
        required:true
    }
})
const RoomModel=mongoose.model("room", room_schema)

module.exports={
    RoomModel
}