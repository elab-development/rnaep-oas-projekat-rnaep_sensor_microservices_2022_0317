const express = require('express');
const router = express.Router();
const irrigationController = require('../controllers/irrigationController');
const { checkZoneAccess, checkRuleAccess } = require('../middleware/auth');

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


// Zone - dodaj checkZoneAccess
router.get('/zones/:zone_id', checkZoneAccess, irrigationController.getZoneById);
router.put('/zones/:zone_id', checkZoneAccess, irrigationController.updateZone);
router.delete('/zones/:zone_id', checkZoneAccess, irrigationController.deleteZone);

// Pravila - dodaj checkRuleAccess
router.get('/rules/:id', checkRuleAccess, irrigationController.getRuleById);
router.put('/rules/:id', checkRuleAccess, irrigationController.updateRule);
router.delete('/rules/:id', checkRuleAccess, irrigationController.deleteRule);

// Provera pravila - dodaj checkZoneAccess (jer koristi zone_id)
router.post('/check', checkZoneAccess, irrigationController.checkRules);

// Ručno upravljanje - dodaj checkZoneAccess
router.post('/manual/on', checkZoneAccess, irrigationController.manualIrrigation);
router.post('/manual/off', checkZoneAccess, irrigationController.manualIrrigationOff);

module.exports = router;