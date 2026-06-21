const { generateShortCode } = require('./snowflake');

const codes = new Set();
const total = 10000;

for (let i = 0; i < total; i++) {
  const code = generateShortCode();
  if (codes.has(code)) {
    console.log('DUPLICATE FOUND:', code);
  }
  codes.add(code);
}

console.log(`Generated ${total} codes, ${codes.size} unique`);
console.log('First 5 codes:', [...codes].slice(0, 5));