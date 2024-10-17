const redis = require("redis");

let redis_client;

function connectToRedis() {
    console.log("runnig redis");
    redis_client = redis.createClient(6379, "127.0.0.1");
    redis_client.connect();
    let subscriberInstance=redis_client.duplicate()
    subscriberInstance.connect()
    redis_client.configSet('notify-keyspace-events', 'Ex')
    subscriberInstance.subscribe('__keyevent@0__:expired',(expiredKey) => {
            if(expiredKey.startsWith('room:')){
                console.log('Room time out , should disconnect game and ...')
            }
    })
    redis_client.on("error", (err) => {
        console.log("encountered error while connecting redis");
        console.error(err);
        process.exit(1);
    });
    redis_client.on("connect", () => {
        console.log("connected to redis");
    });
}

// this function would add user to queue and also would find opponent directly if there was no opponent would send starter user
// info back with [starterInfo] from hashmaps else would return opponent and player in array [starter,opponent] if erro would empty list
async function addPlayerAndFindOpponent(email, level, socketId) {
    // used for sets
    const key = `matchMaking:level:${level}`;
    // used for hashmap
    const playerKey = `player:${email}`;
    //check if user has been in queue or not
    const isPlayerInQueue = await redis_client.sIsMember(key, playerKey);
    if (isPlayerInQueue) {
        console.log("user already in queue can not connect again");
        return;
    }
    // new online user info for setting in hashmap in db
    const playerInfo = {
        email,
        level,
        socketId,
    };
    // adding user to set
    await redis_client.sAdd(key, email, (err, result) => {
        if (err) {
            console.error("error adding player to sets")
            return [];
        }
    })
    // adding user to hashmap
    await redis_client.hSet(playerKey, playerInfo, (err, result) => {
        if (err) {
            console.log("Error saving palyer info in redi :" + err);
            return [];
        }
    });
    let opponentPlayerEmail = await _findOpponent(email, level)
    if (!opponentPlayerEmail) {
        return [playerInfo]
    } else {
        // get opponent player info base on returned email
        let opponentInfo = await redis_client.hGetAll(`player:${opponentPlayerEmail}`);
        return [playerInfo, opponentInfo]
    }
}

// this function would return opponent player if not found or error would be null
async function _findOpponent(currentUserEmail, level) {
    const setKey = `matchMaking:level:${level}`;
    let playersList = await redis_client.sMembers(setKey);
    let indexOfCurrentEmail = playersList.indexOf(currentUserEmail);
    if (indexOfCurrentEmail !== -1) {
        playersList.splice(indexOfCurrentEmail, 1);
    }
    // if list was empty
    if (playersList.length === 0) {
        return null;
    } else {
        if (playersList.length > 1) {
            // randomly select user from list
            const randomPlayerIndex = Math.floor(Math.random() * playersList.length);
            return playersList[randomPlayerIndex];
        } else {
            if (playersList[0] !== currentUserEmail) {
                return playersList[0]
            } else {
                return null;
            }
        }
    }
}


async function removePlayerFromQueue(email, level) {
    const playerKey = `player:${email}`;
    const levelSetKey = `matchMaking:level:${level}`;
    await redis_client.sRem(levelSetKey, email);
    await redis_client.del(playerKey);
}


const setHashMap = async (key, info, time) => {
    await redis_client.hSet(key, info, (err, result) => {
        if (err) {
            console.log(err);
            return -1;
        }

    });
    if(time){
        await redis_client.expire(key,time)
    }
};
module.exports = {
    connectToRedis,
    addPlayerAndFindOpponent,
    removePlayerFromQueue,

   setHashMap,
};
