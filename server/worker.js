const redisClient = require('./redis');
const pool = require('./db');

const QUEUE_KEY = 'click_events';

async function processQueue() {
  console.log('Worker started, watching for click events...');

  while (true) {
    try {
      // BLPOP waits (blocks) until something is in the list — no wasted CPU polling
      const result = await redisClient.blPop(QUEUE_KEY, 0);
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