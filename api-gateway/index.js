const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const client = require('prom-client');
const sanitize = require('./utils/sanitize');
require('dotenv').config();

// === UVOZ CIRCUIT BREAKER ===
const { sensorBreaker, irrigationBreaker, alertBreaker, registerMetrics } = require('./circuitBreaker');

const excludedPaths = ['/metrics', '/health'];

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === PROMETHEUS METRIKE ===
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestsTotal);

// === REGISTRUJ CIRCUIT BREAKER METRIKE ===
registerMetrics(register);

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

// === RUTE SA CIRCUIT BREAKER-OM (BEZ PROXY-JA) ===

// Sensor Service
app.use('/api/sensors', async (req, res) => {
  try {
    console.log(`🔄 API Gateway: Zahtev za Sensor Service: ${req.method} ${req.path}`);
    
    const requestObj = {
      method: req.method,
       path: '/sensors' + req.path,
      body: req.body,
      query: req.query,
      headers: req.headers
    };
    
    const result = await sensorBreaker.fire(requestObj);
    
    if (result && result.error) {
      console.log(`⚠️ Vraćam fallback za Sensor Service`);
      return res.status(503).json(result);
    }
    
    if (result && result.data) {
      return res.status(result.status || 200).json(result.data);
    }
    
    res.json(result);
  } catch (error) {
    console.error(`❌ Circuit Breaker greška za Sensor Service:`, error.message);
    res.status(503).json({
      error: true,
      message: 'Sensor Service trenutno nije dostupan',
      timestamp: new Date().toISOString()
    });
  }
});

// Irrigation Service
app.use('/api/irrigation', async (req, res) => {
  try {
    console.log(`🔄 API Gateway: Zahtev za Irrigation Service: ${req.method} ${req.path}`);
    
    const requestObj = {
      method: req.method,
      path: '/irrigation' + req.path, 
      body: req.body,
      query: req.query,
      headers: req.headers
    };
    
    const result = await irrigationBreaker.fire(requestObj);
    
    if (result && result.error) {
      return res.status(503).json(result);
    }
    
    if (result && result.data) {
      return res.status(result.status || 200).json(result.data);
    }
    
    res.json(result);
  } catch (error) {
    console.error(`❌ Circuit Breaker greška za Irrigation Service:`, error.message);
    res.status(503).json({
      error: true,
      message: 'Irrigation Service trenutno nije dostupan',
      timestamp: new Date().toISOString()
    });
  }
});

// Alert Service
app.use('/api/alerts', async (req, res) => {
  try {
    console.log(`🔄 API Gateway: Zahtev za Alert Service: ${req.method} ${req.path}`);
    
    const requestObj = {
      method: req.method,
      path: '/alerts' + req.path,
      body: req.body,
      query: req.query,
      headers: req.headers
    };
    
    const result = await alertBreaker.fire(requestObj);
    
    if (result && result.error) {
      return res.status(503).json(result);
    }
    
    if (result && result.data) {
      return res.status(result.status || 200).json(result.data);
    }
    
    res.json(result);
  } catch (error) {
    console.error(`❌ Circuit Breaker greška za Alert Service:`, error.message);
    res.status(503).json({
      error: true,
      message: 'Alert Service trenutno nije dostupan',
      timestamp: new Date().toISOString()
    });
  }
});

// Pokreni server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway pokrenut na portu ${PORT}`);
  console.log(`📡 Sensor Service: http://localhost:3001 (Circuit Breaker enabled)`);
  console.log(`📡 Irrigation Service: http://localhost:3002 (Circuit Breaker enabled)`);
  console.log(`📡 Alert Service: http://localhost:3003 (Circuit Breaker enabled)`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gašenje API Gateway...');
  process.exit(0);
});