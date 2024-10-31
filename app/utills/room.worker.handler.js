
const {workerData,parentPort}=require('worker_threads')
const {QuizGame} = require("./quizGame");


console.log(workerData);
let quizGame=new QuizGame()
quizGame.startGame(workerData.gameId)