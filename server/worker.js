const { createClient } = require('redis');
const pool = require('./db');

const QUEUE_KEY = 'click_events';

const workerRedis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

workerRedis.on('error', (err) => console.error('Worker Redis error:', err.message));

async function processQueue() {
  try {
    await workerRedis.connect();
    console.log('Worker connected to Redis');
  } catch (err) {
    console.error('Worker failed to connect to Redis:', err.message);
    return;
  }

  console.log('Worker started, watching for click events...');

  while (true) {
    try {
      const result = await workerRedis.blPop(QUEUE_KEY, 0);
      const event = JSON.parse(result.element);
      console.log('Processing click for', event.shortCode);
      await pool.query(
        'UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1',
        [event.shortCode]
      );
      console.log('Updated click_count for', event.shortCode);
    } catch (err) {
      console.error('Worker error:', err);
    }
  }
}

processQueue();
