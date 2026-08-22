const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const sanitize = require('./utils/sanitize');

const app = express();
const PORT = process.env.PORT || 8080;

// === CORS ===
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// === CSRF ZAŠTITA (SameSite=Strict) ===
app.use(cookieParser());

app.use((req, res, next) => {
  const originalSetCookie = res.setHeader.bind(res, 'Set-Cookie');
  res.setHeader = (name, value, ...args) => {
    if (name === 'Set-Cookie' && value && typeof value === 'string') {
      if (!value.includes('SameSite=')) {
        return originalSetCookie(value + '; SameSite=Strict');
      }
    }
    return originalSetCookie(name, value, ...args);
  };
  next();
});

// === XSS ZAŠTITA ===
app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
});

// Logovanje svih zahteva
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Proxy ka Sensor Service-u
/*app.use('/api/sensors', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  logLevel: 'debug'
}));*/
app.use('/api/sensors', createProxyMiddleware({
  target: 'http://sensor-service:3001',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Proxy ka Irrigation Service-u
/*app.use('/api/irrigation', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  logLevel: 'debug'
}));*/
app.use('/api/irrigation', createProxyMiddleware({
  target: 'http://irrigation-service:3002',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Proxy ka Alert Service-u
/*app.use('/api/alerts', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  logLevel: 'debug'
}));*/
app.use('/api/alerts', createProxyMiddleware({
  target: 'http://alert-service:3003',
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