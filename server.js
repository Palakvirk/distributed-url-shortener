const express = require('express');
const redisClient = require('./redis');
const pool = require('./db');
const { nanoid } = require('nanoid');
const { generateShortCode } = require('./snowflake');
const rateLimiter = require('./rateLimiter');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('URL Shortener is alive!');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/shorten', rateLimiter, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const shortCode = generateShortCode();

    await pool.query(
      'INSERT INTO urls (short_code, original_url) VALUES ($1, $2)',
      [shortCode, url]
    );

    await redisClient.set(shortCode, url, { EX: 3600 });

    res.status(201).json({
      shortUrl: `http://localhost:3000/${shortCode}`,
      original: url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// This must stay BELOW /api/shorten and /test-db,
// since :shortCode would otherwise try to match those paths too
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const cachedUrl = await redisClient.get(shortCode);

    if (cachedUrl) {
      console.log('Cache HIT for', shortCode);
      return res.redirect(cachedUrl);
    }

    console.log('Cache MISS for', shortCode);

    const result = await pool.query(
      'SELECT original_url FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const { original_url } = result.rows[0];
    await redisClient.set(shortCode, original_url, { EX: 3600 });

    res.redirect(original_url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});