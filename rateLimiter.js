const redisClient = require('./redis');

const WINDOW_SECONDS = 60; // 1-minute window
const MAX_REQUESTS = 10;   // max requests allowed per window

async function rateLimiter(req, res, next) {
  const identifier = req.ip; // caller's IP address
  const key = `ratelimit:${identifier}`;

  try {
    const current = await redisClient.incr(key);

    if (current === 1) {
      // first request in this window — start the clock
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    if (current > MAX_REQUESTS) {
      return res.status(429).json({
        error: `Too many requests. Limit is ${MAX_REQUESTS} per ${WINDOW_SECONDS} seconds.`,
      });
    }

    next(); // under the limit — let the request through
  } catch (err) {
    console.error('Rate limiter error:', err);
    next(); // if Redis itself fails, don't block real traffic — fail open
  }
}

module.exports = rateLimiter;