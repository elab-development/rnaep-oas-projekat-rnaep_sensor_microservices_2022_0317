const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, createTables } = require('./models/database');

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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gašenje Irrigation Service...');
  await pool.end();
  console.log('✅ PostgreSQL diskonektovan');
  process.exit(0);
});