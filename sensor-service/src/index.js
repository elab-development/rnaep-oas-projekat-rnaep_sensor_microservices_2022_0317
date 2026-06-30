const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Inicijalizacija express aplikacije
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Konekcija na MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Povezan na MongoDB');
    
    // Pokreni server tek kada je baza povezana
    app.listen(PORT, () => {
      console.log(`🚀 Sensor Service pokrenut na portu ${PORT}`);
      console.log(`📡 Endpoint: http://localhost:${PORT}/api/sensors`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
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