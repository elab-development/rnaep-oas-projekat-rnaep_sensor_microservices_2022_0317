const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// POST /api/sensors/measurements - Prijem podataka sa senzora
router.post('/measurements', sensorController.createReading);

// GET /api/sensors/measurements/:zone_id - Sva očitavanja za zonu
router.get('/measurements/:zone_id', sensorController.getReadingsByZone);

// GET /api/sensors/latest/:zone_id - Poslednje očitavanje za zonu
router.get('/latest/:zone_id', sensorController.getLatestReading);

// GET /api/sensors/zones - Lista svih zona
router.get('/zones', sensorController.getZones);

module.exports = router;