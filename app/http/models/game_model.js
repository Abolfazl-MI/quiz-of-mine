const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.ObjectId,
        ref:"user",
        required: true
    },
    score: {
        type: Number,
        default: 0
    },

});
const game_schema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['ON-GOING', "TIME_OUT", "USER-RESIGN", "FINISHED","NOT-STARTED"],
        default: "NOT-STARTED"
    },
    player_1: {
        type:playerSchema,
        required:true
    },
    player_2: {
        type:playerSchema,
        required:true
    }
},{timestamps:true})
const GameModel=mongoose.model("game", game_schema)

module.exports={
   GameModel
}