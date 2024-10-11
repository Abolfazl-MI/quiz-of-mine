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
function addPlayerToQueue(socketId, level) {
  const playerKey = `player:${socketId}`;

  // Add player to the sorted set for their level
  redis_client.zadd(
    `matchmaking:level:${level}`,
    level,
    playerKey,
    (err, result) => {
      if (err) {
        console.error("Error adding player to Redis queue:", err);
        return;
      }

      console.log(`Player ${socketId} added to Redis queue for level ${level}`);
    }
  );
}
module.exports = {
  connectToRedis,
  addPlayerToQueue,
};
