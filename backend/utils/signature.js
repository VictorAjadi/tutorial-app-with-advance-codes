const crypto = require('crypto');


exports.encrypt = function encrypt(text) {
  process.env.SECRET_KEY=crypto.randomBytes(32).toString('hex');
  const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.SECRET_KEY, 'hex'); // Ensure this is a 32-byte hex-encoded string
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}


  
exports.decrypt = function decrypt(encryptedText) {
  const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.SECRET_KEY, 'hex'); // Ensure this is a 32-byte hex-encoded string
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

