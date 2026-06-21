const { createClient } = require('redis');

const redisClient = createClient(); // defaults to localhost:6379

redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

module.exports = redisClient;