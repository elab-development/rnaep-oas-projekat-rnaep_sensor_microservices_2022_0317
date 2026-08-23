const express = require('express');
const cors = require('cors');
const client = require('prom-client'); // <-- DODATO
require('dotenv').config();
const { pool, createTables } = require('./models/database');
const { initializeConsumer, startConsumer } = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3002;

// === PROMETHEUS METRIKE ===
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestsTotal);

app.use(cors());
app.use(express.json());

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
const irrigationRoutes = require('./routes/irrigationRoutes');
app.use('/api/irrigation', irrigationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'irrigation-service',
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Pokreni server
const startServer = async () => {
  try {
    await createTables();

    await initializeConsumer();
    await startConsumer(async (data) => {
      console.log('📥 Kafka: Procesiram poruku od Sensor Service-a');
      const { zone_id, moisture, temperature, timestamp } = data;
      const req = { body: { zone_id, moisture, temperature, timestamp } };
      const res = {
        json: (data) => console.log('✅ Kafka: Odgovor:', data),
        status: (code) => ({ json: (data) => console.log(`❌ Kafka: Greška ${code}:`, data) })
      };
      await irrigationController.checkRules(req, res);
    });
    console.log('✅ Kafka Consumer pokrenut');

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`🚀 Irrigation Service pokrenut na portu ${PORT}`);
        console.log(`📡 Endpoint: http://localhost:${PORT}/api/irrigation`);
        console.log(`💚 Health check: http://localhost:${PORT}/health`);
        console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
      });
    } else {
      module.exports = app;
    }

  } catch (error) {
    console.error('❌ Greška pri pokretanju:', error);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gašenje Irrigation Service...');
  await pool.end();
  console.log('✅ PostgreSQL diskonektovan');
  process.exit(0);
});