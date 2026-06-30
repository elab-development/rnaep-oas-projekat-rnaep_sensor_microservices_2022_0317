const axios = require('axios');

const IRRIGATION_URL = process.env.IRRIGATION_SERVICE_URL || 'http://localhost:3002';
const ALERT_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:3003';

// Prosledi očitavanje ka Irrigation Service
async function forwardToIrrigation(reading) {
  try {
    await axios.post(`${IRRIGATION_URL}/api/irrigation/check`, {
      zone_id: reading.zone_id,
      moisture: reading.moisture,
      temperature: reading.temperature,
      timestamp: reading.timestamp
    }, {
      timeout: 3000 // 3 sekunde timeout
    });
    
    console.log(`📤 Prosleđeno ka Irrigation za zonu ${reading.zone_id}`);
  } catch (error) {
    console.error(`❌ Greška pri prosleđivanju ka Irrigation:`, error.message);
    throw error; // Propagiraj grešku da bi je pozivaoc uhvatio
  }
}

// Prosledi očitavanje ka Alert Service
async function forwardToAlert(reading) {
  try {
    await axios.post(`${ALERT_URL}/api/alerts/check`, {
      zone_id: reading.zone_id,
      moisture: reading.moisture,
      timestamp: reading.timestamp
    }, {
      timeout: 3000
    });
    
    console.log(`📤 Prosleđeno ka Alert za zonu ${reading.zone_id}`);
  } catch (error) {
    console.error(`❌ Greška pri prosleđivanju ka Alert:`, error.message);
    throw error;
  }
}

module.exports = {
  forwardToIrrigation,
  forwardToAlert
};