const express = require('express');
const router = express.Router();
const irrigationController = require('../controllers/irrigationController');

// Zone
router.get('/zones', irrigationController.getZones);
router.post('/zones', irrigationController.createZone);

// Pravila (CRUD)
router.post('/rules', irrigationController.createRule);
router.get('/rules', irrigationController.getRules);
router.get('/rules/:id', irrigationController.getRuleById);
router.put('/rules/:id', irrigationController.updateRule);
router.delete('/rules/:id', irrigationController.deleteRule);

// Provera pravila (poziva Sensor Service)
router.post('/check', irrigationController.checkRules);

// Ručno upravljanje
router.post('/manual/on', irrigationController.manualIrrigation);
router.post('/manual/off', irrigationController.manualIrrigationOff);

// Vremenska prognoza za zonu
router.get('/weather/:zone_id', irrigationController.getWeatherForecast);

// Višednevna vremenska prognoza za zonu
router.get('/forecast/:zone_id', irrigationController.getWeatherForecast7Days);

module.exports = router;