const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initializeProducer } = require('./kafka/producer');
const client = require('prom-client'); // <-- DODATO
require('dotenv').config();

// Inicijalizacija express aplikacije
const app = express();
const PORT = process.env.PORT || 3001;

// === PROMETHEUS METRIKE ===
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Brojač HTTP zahteva
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestsTotal);

// Middleware
app.use(cors());
app.use(express.json());

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

// Import ruta
const sensorRoutes = require('./routes/sensorRoutes');

// Mountovanje ruta na /api/sensors
app.use('/api/sensors', sensorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sensor-service',
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Konekcija na MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Povezan na MongoDB');
    
    // === KAFKA ===
    try {
      await initializeProducer();
      console.log('✅ Kafka Producer inicijalizovan');
    } catch (error) {
      console.error('❌ Kafka Producer greška:', error);
    }

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`🚀 Sensor Service pokrenut na portu ${PORT}`);
        console.log(`📡 Endpoint: http://localhost:${PORT}/api/sensors`);
        console.log(`💚 Health check: http://localhost:${PORT}/health`);
        console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
      });
    } else {
      module.exports = app;
    }
  })
  .catch((error) => {
    console.error('❌ Greška pri povezivanju na MongoDB:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gašenje Sensor Service...');
  await mongoose.disconnect();
  console.log('✅ MongoDB diskonektovan');
  process.exit(0);
});