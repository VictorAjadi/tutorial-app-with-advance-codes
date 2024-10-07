const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Define certificate directory and paths
const CERT_DIR = path.resolve(__dirname, '../cert');
const keyPath = path.join(CERT_DIR, 'server.key');
const certPath = path.join(CERT_DIR, 'server.cert');

// Ensure the certificate directory exists
if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
}

// Generate certificates if they do not exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Generating SSL certificates...');

    // Use OpenSSL to generate the certificate
    exec(`openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -subj "/C=US/ST=State/L=City/O=Company/OU=Org/CN=localhost"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error generating certificate: ${error.message}`);
            process.exit(1);
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`Certificate generated successfully: ${stdout}`);
        process.exit(0); // Exit with success code
    });
} else {
    console.log('SSL certificates already exist.');
    process.exit(0); // Exit with success code
}
