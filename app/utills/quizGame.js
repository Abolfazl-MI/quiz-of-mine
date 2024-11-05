const axios = require('axios');
require('dotenv').config()
const {parentPort, workerData, threadId} = require('worker_threads');
const {GameModelController} = require("../http/controllers/gameModelController");
const {generateUserToken} = require("./functions");
const {v4: uuidv4,} = require("uuid");

const {response} = require("express");

let quizGameEventNames = Object.freeze({
    GAME_TIME_OUT: "GAME_TIME_OUT",
    GAME_ERROR: "GAME_ERROR",
    GAME_JWT_CREATED: "Game_jwt_created",
    NEXT_QUESTION: "NEXT_QUESTION",
    FINISH_GAME:"FINISH_GAME",
    QUESTION_TIME_OUT: "QUESTION_TIME_OUT"
})
let _gameState = Object.freeze({
    ON_GOING: "ON_GOING", USER_RESIGN: "USER_RESIGN", TIME_OUI: "TIME_OUT"
})

class QuizGame {
    // time is second here
    #_gameTimeSpent = 0
    #_gameState
    #_gameTimerIntervalId
    #match_question = []
    #_match_used_questions=[]
    #_selectedQuestion
    #parentPort
    #quizTimeLimit
    #questionPerRoom

    constructor(parentPort) {
        this.#parentPort = parentPort;
    }

    #_selectedQuestionIntervalId
    #_selectedQuestionTimeSpend

    async _fetchQuestions() {

        await axios.get(`https://opentdb.com/api.php?amount=${this.#questionPerRoom}&category=9&type=multiple`)
            .then((response) => {
                let questions = response.data.results;
                questions.forEach((question) => {
                    let match_question = {};
                    match_question['question_id']=uuidv4()
                    match_question['question'] = question.question;
                    match_question['correct_answer'] = question.correct_answer
                    match_question['all_answers'] = [...question.incorrect_answers, question.correct_answer];
                    this.#match_question.push(match_question);
                })
            }).catch((error) => {
                // TODO terminate game on err fetching question
                this._postMessage({
                    "E": quizGameEventNames.GAME_ERROR, "D": {
                        "err": error
                    }
                })
            })
    }

    /*this method is reponsible for selecting random questions from fetched from server and setting it to #_selectedQuestion if list was empty would return null and make that selected null*/
    _selectRandomQuestion() {

        if (this.#match_question.length < 0) {
            this.#_selectedQuestion = null
            return null
        }
        // get random number base on the question length
        const randomIndex = Math.floor(Math.random() * this.#match_question.length)
        // storing selected question
        this.#_selectedQuestion = this.#match_question[randomIndex]
        // console.log('selected question =>')
        // console.log(this.#_selectedQuestion)
        // remove correct answer from object

        // add selected question to match used list
        this.#_match_used_questions.push(this.#_selectedQuestion)

        delete this.#_selectedQuestion['correct_answer']
        // removing selected question from array
        this.#match_question.splice(randomIndex, 1)
    }

    _tickGameQuestion() {

        let questionTimeLimit = this.#quizTimeLimit / this.#questionPerRoom
        if (!this.#_selectedQuestion&&this.#match_question.length>0) {
            // if question was empty fires to select
            this._selectRandomQuestion()
        }
        // post question to master
        this._postMessage({
            "E":quizGameEventNames.NEXT_QUESTION,
            "D":{
                "data":this.#_selectedQuestion
            }
        })
        // set interval timer for checking time of question
        this.#_selectedQuestionIntervalId= setInterval(()=>{
            // each seconds handler would check that the selectedQuestionTime spend has reached to result of questionTimeLimit or not
            if(this.#_selectedQuestionTimeSpend<questionTimeLimit){
                this.#_selectedQuestionTimeSpend+=1


            }else{

                clearInterval(this.#_selectedQuestionIntervalId)
                this.#_selectedQuestionIntervalId=null
                this.#_selectedQuestionTimeSpend=0
                // here is time out part where selected question time is up , and it's time to send question time up message and rerun method
                // find selected question from used qustions to be able to send correct answers to clinets
                let timeOutedQuestion=this.#_match_used_questions.find((usedQuestion)=>usedQuestion.question_id===this.#_selectedQuestion.question_id)
                // // the _selectedQuestionTimeSpend and  _selectedQuestionIntervalId should be null
                this._postMessage({
                    "E":quizGameEventNames.QUESTION_TIME_OUT,
                    "D":{
                        "data":{
                            "message":"question time out",
                            "data":timeOutedQuestion
                        }
                    }
                })
                // check if question remains to recall method
                if(this.#match_question.length>0){
                    this._tickGameQuestion()
                }else{
                    // game question are finished so we have to finish the game
                    clearInterval(this.#_selectedQuestionIntervalId)
                    this.#_selectedQuestionIntervalId=null
                    this.#_selectedQuestionTimeSpend=0
                    this._postMessage({
                        "E":quizGameEventNames.FINISH_GAME,
                        "D":{
                            "data":{
                                "message":"Game questions are finished we are wraping up"
                            }
                        }
                    })
                }
            }
        },1000)
    }

    _tickGameTimer() {
        // game time would be calculated by dividing the total given time divided by number of questions in seconds
        if (this.#_gameState === _gameState.TIME_OUI) {
            clearInterval(this.#_gameTimerIntervalId)
            // console.log('updated game state to time out')
        }
        this.#_gameTimerIntervalId = setInterval(() => {
            if (this.#_gameTimeSpent < this.#quizTimeLimit) {
                this.#_gameTimeSpent += 1;
            } else {
                this.#_gameState = _gameState.TIME_OUI
                clearInterval(this.#_gameTimerIntervalId)
                this.#_gameTimerIntervalId = null
                // sends time out message to worker
                this._postMessage({
                    "E": quizGameEventNames.GAME_TIME_OUT, "D": {
                        "message": "Game Time out reach"
                    }
                })
            }
        }, 1000)
    }

    _postMessage(data) {
        this.#parentPort.postMessage(data)
    }

    async startGame(questionPerRoom, quizTimeLimit) {
        this.#questionPerRoom = questionPerRoom
        this.#quizTimeLimit = quizTimeLimit
        console.info(`game created worker thread id is ${threadId}`)
        await this._fetchQuestions()
        this._tickGameTimer()
        this._tickGameQuestion()
    }
}

module.exports = {
    QuizGame, quizGameEventNames
}