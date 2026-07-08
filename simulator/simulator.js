const axios = require('axios');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ===== KONFIGURACIJA =====
const app = express();
app.use(cors());
app.use(express.json());

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const SENSOR_ID = process.env.SENSOR_ID || 'SENSOR_01';
let ZONE_ID = process.env.ZONE_ID || 'ZONE_1'; // Podeseća se preko HTTP
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 15000;
const SIMULATOR_PORT = parseInt(process.env.SIMULATOR_PORT) || 3005;

let intervalId = null;

// ===== GENERISANJE PODATAKA =====
function generateSensorData() {
  return {
    sensor_id: SENSOR_ID,
    zone_id: ZONE_ID,
    moisture: Math.round((20 + Math.random() * 40) * 100) / 100,
    temperature: Math.round((15 + Math.random() * 20) * 100) / 100,
    humidity: Math.round((30 + Math.random() * 50) * 100) / 100,
    timestamp: new Date().toISOString()
  };
}

// ===== SLANJE PODATAKA =====
async function sendMeasurement() {
  try {
    const data = generateSensorData();
    
    console.log(`📡 Šaljem očitavanje za zonu ${ZONE_ID}:`, {
      sensor_id: data.sensor_id,
      moisture: data.moisture + '%',
      temperature: data.temperature + '°C'
    });

    const response = await axios.post(
      `${API_GATEWAY_URL}/api/sensors/measurements`,
      data,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    console.log(`✅ Uspešno poslato za zonu ${ZONE_ID}`);
  } catch (error) {
    console.error(`❌ Greška pri slanju za zonu ${ZONE_ID}:`, error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// ===== POKRENI SLANJE U INTERVALIMA =====
function startSending() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  // Pošalji odmah
  sendMeasurement();
  // Zatim na svaki interval
  intervalId = setInterval(sendMeasurement, INTERVAL_MS);
}

// ===== HTTP ENDPOINTI =====

// 1. Promena zone
app.post('/set-zone', (req, res) => {
  const { zone_id } = req.body;
  
  if (!zone_id) {
    return res.status(400).json({ 
      error: 'zone_id je obavezan parametar',
      example: { zone_id: 'ZONE_1' }
    });
  }

  // Proveri da li je zona validna (opciono)
  const oldZone = ZONE_ID;
  ZONE_ID = zone_id;
  
  console.log(`🔄 Zona promenjena: ${oldZone} → ${ZONE_ID}`);
  
  // Resetuj interval da odmah pošalje podatke za novu zonu
  startSending();

  res.json({ 
    message: `Zona uspešno promenjena`,
    previous_zone: oldZone,
    current_zone: ZONE_ID 
  });
});

// 2. Dohvati trenutnu zonu
app.get('/current-zone', (req, res) => {
  res.json({ 
    zone_id: ZONE_ID,
    sensor_id: SENSOR_ID,
    interval_ms: INTERVAL_MS
  });
});

// 3. Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'simulator',
    zone_id: ZONE_ID,
    interval_ms: INTERVAL_MS,
    sensor_id: SENSOR_ID
  });
});

// ===== POKRENI SERVER =====
app.listen(SIMULATOR_PORT, () => {
  console.log(`🚀 Simulator server pokrenut na portu ${SIMULATOR_PORT}`);
  console.log(`   API Gateway: ${API_GATEWAY_URL}`);
  console.log(`   Trenutna zona: ${ZONE_ID}`);
  console.log(`   Sensor ID: ${SENSOR_ID}`);
  console.log(`   Interval: ${INTERVAL_MS}ms`);
  console.log(`   Ctrl+C za zaustavljanje`);
  console.log(`\n📋 Endpointi:`);
  console.log(`   POST /set-zone  - Promena zone (body: { "zone_id": "ZONE_1" })`);
  console.log(`   GET  /current-zone  - Trenutna zona`);
  console.log(`   GET  /health  - Status`);
  
  // Pošalji prvo očitavanje
  startSending();
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', () => {
  console.log('\n👋 Gašenje simulatora...');
  if (intervalId) clearInterval(intervalId);
  process.exit(0);
});