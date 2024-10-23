const crypto = require('crypto');

exports.encryptRole = async function (role) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.HASHROLESECRET, 'hex'); // Ensure this is a 32-byte hex-encoded string
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(role, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
  
  
    
exports.decryptRole = async function (hashRole) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.HASHROLESECRET, 'hex'); // Ensure this is a 32-byte hex-encoded string
    const parts = hashRole.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}