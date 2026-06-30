const axios = require('axios');
require('dotenv').config();

// Konfiguracija
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const SENSOR_ID = process.env.SENSOR_ID || 'SENSOR_01';
const ZONE_ID = process.env.ZONE_ID || 'ZONE_1';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 15000; // 15 sekundi

// Generiši random vrednosti
function generateSensorData() {
  return {
    sensor_id: SENSOR_ID,
    zone_id: ZONE_ID,
    moisture: Math.round((20 + Math.random() * 40) * 100) / 100, // 20-60%
    temperature: Math.round((15 + Math.random() * 20) * 100) / 100, // 15-35°C
    humidity: Math.round((30 + Math.random() * 50) * 100) / 100, // 30-80%
    timestamp: new Date().toISOString()
  };
}

// Pošalji podatke ka Sensor Service-u preko API Gateway-a
async function sendMeasurement() {
  try {
    const data = generateSensorData();
    
    console.log(`📡 Šaljem očitavanje:`, {
      sensor_id: data.sensor_id,
      moisture: data.moisture + '%',
      temperature: data.temperature + '°C'
    });

    const response = await axios.post(
      `${API_GATEWAY_URL}/api/sensors/measurements`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 sekundi timeout
      }
    );

    console.log(`✅ Uspešno poslato:`, response.data);
  } catch (error) {
    console.error(`❌ Greška pri slanju:`, error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Pokreni slanje u intervalima
console.log(`🚀 Simulator pokrenut!`);
console.log(`   API Gateway: ${API_GATEWAY_URL}`);
console.log(`   Sensor ID: ${SENSOR_ID}`);
console.log(`   Interval: ${INTERVAL_MS}ms`);
console.log(`   Ctrl+C za zaustavljanje\n`);

// Prvo slanje odmah, zatim na svaki interval
sendMeasurement();
setInterval(sendMeasurement, INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Gašenje simulatora...');
  process.exit(0);
});