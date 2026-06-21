// Snowflake-style unique ID generator — no DB lookup needed, ever

const EPOCH = 1735689600000n; // custom epoch: Jan 1, 2025

const WORKER_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;

const MAX_WORKER_ID = (1n << WORKER_ID_BITS) - 1n; // 1023
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;    // 4095

const WORKER_ID_SHIFT = SEQUENCE_BITS;
const TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;

const WORKER_ID = BigInt(process.env.WORKER_ID || 1);

if (WORKER_ID > MAX_WORKER_ID) {
  throw new Error(`WORKER_ID must be between 0 and ${MAX_WORKER_ID}`);
}

let lastTimestamp = -1n;
let sequence = 0n;

function generateId() {
  let timestamp = BigInt(Date.now());

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & MAX_SEQUENCE;
    if (sequence === 0n) {
      // exhausted 4096 IDs in this millisecond — wait for the next one
      while (timestamp <= lastTimestamp) {
        timestamp = BigInt(Date.now());
      }
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  return (
    ((timestamp - EPOCH) << TIMESTAMP_SHIFT) |
    (WORKER_ID << WORKER_ID_SHIFT) |
    sequence
  );
}

// Convert the big number into a short, URL-safe string
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encodeBase62(num) {
  if (num === 0n) return ALPHABET[0];
  let result = '';
  while (num > 0n) {
    result = ALPHABET[Number(num % 62n)] + result;
    num = num / 62n;
  }
  return result;
}

function generateShortCode() {
  return encodeBase62(generateId());
}

module.exports = { generateId, encodeBase62, generateShortCode };