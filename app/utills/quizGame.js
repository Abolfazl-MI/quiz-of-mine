const axios = require('axios');
const {parentPort, workerData} = require('worker_threads');
const {GameModelController} = require("../http/controllers/gameModelController");
const {generateUserToken} = require("./functions");
const {v4: uuidv4,} = require("uuid");
let quizGameEventNames = Object.freeze({
    GAME_TIME_OUT: "GAME_TIME_OUT",
    GAME_ERROR: "GAME_ERROR",
    GAME_JWT_CREATED: "Game_jwt_created"
})
let _gameState = Object.freeze({
    ON_GOING: "ON_GOING",
    USER_RESIGN: "USER_RESIGN",
    TIME_OUI: "TIME_OUT"
})

class QuizGame {
    // time is second here
    #_gameTimeSpent = 0
    #_gameState
    #_gameTimerIntervalId
    #match_question = []

    async _fetchQuestions() {
        await axios.get('https://opentdb.com/api.php?amount=10&category=9&type=multiple')
            .then((response) => {
                let questions = response.data.results;
                questions.forEach((question) => {
                    let match_question = {};
                    match_question['question'] = question.question;
                    match_question['correct_answer'] = question.correct_answer
                    match_question['all_answers'] = [...question.incorrect_answers, question.correct_answer];
                    this.#match_question.push(match_question);
                })
            }).catch((error) => {
                parentPort.postMessage({
                    "E": quizGameEventNames.GAME_ERROR,
                    "D": {
                        "err": error
                    }
                })
            })
    }

    _tickGameTimer() {
        if (this.#_gameState === _gameState.TIME_OUI) {
            clearInterval(this.#_gameTimerIntervalId)
            console.log('updated game state to time out')
        }
        this.#_gameTimerIntervalId = setInterval(() => {
            if (this.#_gameTimeSpent < 10) {
                this.#_gameTimeSpent += 1;
                console.log('game time spent is : ' + this.#_gameTimeSpent)
            } else {
                this.#_gameState=_gameState.TIME_OUI
                clearInterval(this.#_gameTimerIntervalId)
                this.#_gameTimerIntervalId = null
                console.log('game time out reach')
            }
        }, 1000)
    }


    async startGame(gameId) {
        console.log('we are reading game id from slave and id is')
        console.log(gameId)
        await this._fetchQuestions()
        console.log('questions are ')
        console.log(this.#match_question)
        console.log('initializing game timer')
        this._tickGameTimer()
    }
}

module.exports = {
    QuizGame, quizGameEventNames
}