const jwt = require('jsonwebtoken');

require('dotenv').config();

function signToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
//Header+Payload+signature
//1 time db access 
//usre->browser->backend server->db