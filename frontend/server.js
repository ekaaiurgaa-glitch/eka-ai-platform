const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;
const BACKEND_URL = 'http://localhost:8001';

// Proxy all requests to the Flask backend
app.use('/', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  logLevel: 'warn'
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend proxy running on port ${PORT}, forwarding to ${BACKEND_URL}`);
});
