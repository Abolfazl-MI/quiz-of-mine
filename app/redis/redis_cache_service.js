const redis = require("redis");

let redis_client;
function connectToRedis() {
  console.log("runnig redis");
  redis_client = redis.createClient(6379, "127.0.0.1");
  redis_client.connect();
  redis_client.on("error", (err) => {
    console.log("encountered error while connecting redis");
    console.error(err);
    process.exit(1);
  });
  redis_client.on("connect", () => {
    console.log("connected to redis");
  });
}
async function addPlayerToQueue(email, level, socketId) {
  console.log(socketId)
  const playerKey = `player:${email}`;
  const isPlayerInQueue = await redis_client.zScore(
    `matchmaking:level:${level}`,
    playerKey
  );
  if (isPlayerInQueue !== null) {
    console.log("player" + email + "is already in queue");
    return;
  }
  // Add player to the sorted set for their level
  await redis_client.zAdd(
    `matchmaking:level:${level}`,
    {
      score: level,
      value: playerKey,
    },

    (err, result) => {
      if (err) {
        console.error("Error adding player to Redis queue:", err);
        return;
      }
      console.log(result);
      console.log(`Player ${email} added to Redis queue for level ${level}`);
    }
  );
  let playerInfo={
    email,
    level,
    socketId
  }
  await redis_client.hSet(`player:${email}`,playerInfo,(error,result)=>{
    if(error){
      console.log('error in saving users in hmset')
      return 
    }
    console.log(result)
  })
}

async function removePlayerFromQueue(email, level) {
  const playerKey = `player:${email}`;

  await redis_client.zRem(
    `matchmaking:level:${level}`,
    playerKey,
    (err, result) => {
      if (err) {
        console.error("Error adding player to Redis queue:", err);
        return;
      }
      console.log(result);

      console.log(
        `Player ${socketid} removed from  Redis queue for level ${level}`
      );
    }
  );
  await redis_client.del(playerKey)

}
const findOpponent = (email, level) => {
  const levelRange = [level - 2, level + 2];  // Match within 2 levels

  for (let i = levelRange[0]; i <= levelRange[1]; i++) {
    const key = `matchmaking:level:${i}`;

    // Get the first player from the sorted set (other than the current player)
    client.zrange(key, 0, 0, (err, players) => {
      if (err) {
        console.error('Error fetching players from Redis:', err);
        return;
      }

      const opponentKey = players.find((player) => player !== `player:${email}`);

      if (opponentKey) {
        // Remove both players from the queue and notify them of the match
        client.zRem(key, `player:${socket.id}`);
        client.zRem(key, opponentKey);

        const opponentId = opponentKey.split(':')[1];  // Extract socket ID

        socket.emit('matchFound', { opponent: opponentId });
        io.to(opponentId).emit('matchFound', { opponent: socket.id });

        console.log(`Match found: ${socket.id} vs ${opponentId}`);
        return;
      }
    });
  }

  console.log(`No opponent found for player ${socket.id}, waiting...`);
};
module.exports = {
  connectToRedis,
  addPlayerToQueue,
  removePlayerFromQueue,
};
