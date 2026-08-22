const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, createTables } = require('./models/database');
const { initializeConsumer, startConsumer } = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

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

// Pokreni server
const startServer = async () => {
  try {
    // Kreiraj tabele
    await createTables();

    // === KAFKA ===
    await initializeConsumer();
    await startConsumer(async (data) => {
      console.log('📥 Kafka: Procesiram poruku od Sensor Service-a');
      // Ovde pozivamo checkRules logiku
      const { zone_id, moisture, temperature, timestamp } = data;
      
      // Rekreiraj req i res objekte za checkRules
      const req = { body: { zone_id, moisture, temperature, timestamp } };
      const res = {
        json: (data) => console.log('✅ Kafka: Odgovor:', data),
        status: (code) => ({ json: (data) => console.log(`❌ Kafka: Greška ${code}:`, data) })
      };
      
      // Pozovi checkRules
      await irrigationController.checkRules(req, res);
    });
    console.log('✅ Kafka Consumer pokrenut');
    
    /*app.listen(PORT, () => {
      console.log(`🚀 Irrigation Service pokrenut na portu ${PORT}`);
      console.log(`📡 Endpoint: http://localhost:${PORT}/api/irrigation`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });*/

    if (require.main === module) {
    // Pokreće se direktno
    const startServer = async () => {
      try {
        await createTables();
        app.listen(PORT, () => {
          console.log(`🚀 Irrigation Service pokrenut na portu ${PORT}`);
          console.log(`📡 Endpoint: http://localhost:${PORT}/api/irrigation`);
          console.log(`💚 Health check: http://localhost:${PORT}/health`);
        });
      } catch (error) {
        console.error('❌ Greška pri pokretanju:', error);
      }
    };
    startServer();
  } else {
    // Učitava se kao modul (za testove)
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