// Deterministic-but-random dummy payment gateway simulator (no real payment processor)
const { v4: uuidv4 } = require('uuid');

function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length !== 16) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function validateExpiry(expiry) {
  // MM/YY
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month, 0);
  return expDate >= now;
}

function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

// Simulates gateway outcome using configured success rate (default 90%)
function simulateGatewayOutcome() {
  const successRate = parseFloat(process.env.GATEWAY_SUCCESS_RATE || '0.90');
  const roll = Math.random();
  return roll <= successRate
    ? { status: 'success', error_message: null }
    : { status: 'failed', error_message: 'Bank declined the transaction (simulated 10% failure).' };
}

function generateTransactionReference() {
  return `TXN-${uuidv4().split('-')[0].toUpperCase()}`;
}

module.exports = { luhnCheck, validateExpiry, validateCVV, simulateGatewayOutcome, generateTransactionReference };
