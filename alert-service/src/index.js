const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, createTables } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Import ruta
const alertRoutes = require('./routes/alertRoutes');
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'alert-service',
    timestamp: new Date().toISOString()
  });
});

// Pokreni server
const startServer = async () => {
  try {
    // Kreiraj tabele
    await createTables();
    
    app.listen(PORT, () => {
      console.log(`🚀 Alert Service pokrenut na portu ${PORT}`);
      console.log(`📡 Endpoint: http://localhost:${PORT}/api/alerts`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Greška pri pokretanju:', error);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gašenje Alert Service...');
  await pool.end();
  console.log('✅ PostgreSQL diskonektovan');
  process.exit(0);
});