const axios = require('axios');

const PAYPAL_API = process.env.NODE_ENV === "development"
  ? 'https://api.sandbox.paypal.com'
  : 'https://api.paypal.com';

async function generateAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios({
    url: `${PAYPAL_API}/v1/oauth2/token`,
    method: 'post',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: 'grant_type=client_credentials',
  });

  return response.data.access_token;
}

// Function to create a client instance
async function paypalRequest(endpoint, method = 'POST', data = {}) {
  const accessToken = await generateAccessToken();

  const response = await axios({
    url: `${PAYPAL_API}${endpoint}`,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    data,
  });

  return response.data;
}

module.exports = { paypalRequest };
