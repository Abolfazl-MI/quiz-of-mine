const EventEmitter=require('node:events')
const { workerData, parentPort,Worker,isMainThread } = require("worker_threads");
const path=require('path')
const {v4: uuidv4,} = require("uuid");
class SlaveHandler extends  EventEmitter{
    #gameId
    #roomId
    #worker
    constructor(roomId){
        super()
        this.#roomId = roomId;
        this.createSlave().then((value)=>{
            this.listenToMessages()
        }).catch(err=>{
            throw err
        })
        this.#gameId=uuidv4();
    }
    createSlave(){
        return new Promise((resolve,reject)=>{
            try{
                if(isMainThread){
                    let workerFilePath=path.join(__dirname,'..','..','/utills/room.worker.handler.js')
                    console.log('worker path is '+workerFilePath)
                    this.#worker=new Worker(workerFilePath,
                        {
                            workerData: {
                                "roomId":this.#roomId
                            }
                        })
                    return resolve(this.#worker);

                }else {
                    reject(new Error("Cannot create worker on a non-main thread."));
                }
            }catch(e){
                return reject(e);
            }
        })
    }
   listenToMessages(){
        this.#worker.on("message",(message)=>{
            this.emit("message",message)
        })
    }

   sendMessageToMaster(message){
        return new Promise((resolve,reject)=>{
            try{
               parentPort.postMessage(message)
                return resolve();
            }catch(e){
                return  reject(e)
            }
        })
   }
}

module.exports={
    SlaveHandler
}