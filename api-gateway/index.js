const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS za sve zahteve
app.use(cors());

// Logovanje svih zahteva
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Health check za API Gateway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Proxy ka Sensor Service-u
app.use('/api/sensors', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Proxy ka Irrigation Service-u
app.use('/api/irrigation', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Proxy ka Alert Service-u
app.use('/api/alerts', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Pokreni server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway pokrenut na portu ${PORT}`);
  console.log(`📡 Sensor Service: http://localhost:3001`);
  console.log(`📡 Irrigation Service: http://localhost:3002`);
  console.log(`📡 Alert Service: http://localhost:3003`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gašenje API Gateway...');
  process.exit(0);
});