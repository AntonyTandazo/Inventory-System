// Netlify Function wrapper for Express app
const serverless = require('serverless-http');

// Import the Express app
const app = require('../../backend/app');

// Export the serverless handler
const handler = serverless(app);

module.exports = { handler };
