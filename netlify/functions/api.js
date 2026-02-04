const serverless = require('serverless-http');
const app = require('../../backend/app');

// Exportar el handler para Netlify
exports.handler = serverless(app);
