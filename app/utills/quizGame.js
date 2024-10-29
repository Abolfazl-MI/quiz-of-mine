const axios = require('axios');
const {parentPort}=require('worker_threads');

let quizGameEventNames=Object.freeze({
    GAME_TIME_OUT:"GAME_TIME_OUT",
})

class QuizGame   {

    #match_question = []

    async _fetchQuestions() {
        await axios.get('https://opentdb.com/api.php?amount=10&category=9&type=multiple')
            .then((response) => {
                let questions = response.data.results;
                questions.forEach((question) => {
                    let match_question = {};
                    match_question['question'] = question.question;
                    match_question['correct_answer']=question.correct_answer
                    match_question['all_answers']=[...question.incorrect_answers,question.correct_answer];
                    this.#match_question.push(match_question);
                })
            }).catch((error) => {
                throw error;
            })
    }
    // game timer up to 3 min game
    _startGameTimer(){
     return new Promise(resolve=>setTimeout(resolve, 300));
    }
    async startGame(roomId){
        console.log(`Game started in room ${roomId}`)
        console.log(`getting game questions`)
        await this._fetchQuestions()
        console.log('questions are ')
        console.log(this.#match_question)
        console.log('initializing game timer')
        this._startGameTimer().then(value=>{
            // game ends need to send message
            parentPort.postMessage({'e':quizGameEventNames.GAME_TIME_OUT,'d':"game time finish"})
        })
    }
}

module.exports = {
    QuizGame,quizGameEventNames
}