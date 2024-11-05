
const {workerData,parentPort}=require('worker_threads')
const {QuizGame} = require("./quizGame");


// console.log(workerData);
let {questionPerRoom,quizTimeLimit}=workerData;
let quizGame=new QuizGame(parentPort)
quizGame.startGame(questionPerRoom,quizTimeLimit);