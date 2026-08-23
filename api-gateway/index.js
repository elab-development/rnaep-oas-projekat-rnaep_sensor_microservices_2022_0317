const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const client = require('prom-client');
const sanitize = require('./utils/sanitize');
require('dotenv').config();

const excludedPaths = ['/metrics', '/health'];


const app = express();
const PORT = process.env.PORT || 8080;

// === PROMETHEUS METRIKE ===
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestsTotal);

// === CORS ===
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// === CSRF ZAŠTITA ===
app.use(cookieParser());

app.use((req, res, next) => {
  // Preskoči za izuzete rute
  if (excludedPaths.includes(req.path)) {
    return next();
  }
  
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
  // Preskoči za izuzete rute
  if (excludedPaths.includes(req.path)) {
    return next();
  }
  
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

// Middleware za brojanje zahteva
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode
    });
  });
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

// === PROMETHEUS METRICS ENDPOINT ===
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await register.metrics();

    res.status(200);
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.end(metrics);

    console.log('✅ Metrics served with Content-Type');
  } catch (err) {
    console.error('❌ Metrics error:', err);
    res.status(500).set('Content-Type', 'text/plain').end('Error: ' + err.message);
  }
});

// Proxy ka Sensor Service-u
app.use('/api/sensors', createProxyMiddleware({
  target: 'http://sensor-service:3001',
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: {
    '^/api/sensors': ''  
  }
}));

// Proxy ka Irrigation Service-u
app.use('/api/irrigation', createProxyMiddleware({
  target: 'http://irrigation-service:3002',
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: {
    '^/api/irrigation': ''  
  }
}));

// Proxy ka Alert Service-u
app.use('/api/alerts', createProxyMiddleware({
  target: 'http://alert-service:3003',
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: {
    '^/api/alerts': ''  
  }
}));

// Pokreni server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway pokrenut na portu ${PORT}`);
  console.log(`📡 Sensor Service: http://localhost:3001`);
  console.log(`📡 Irrigation Service: http://localhost:3002`);
  console.log(`📡 Alert Service: http://localhost:3003`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gašenje API Gateway...');
  process.exit(0);
});