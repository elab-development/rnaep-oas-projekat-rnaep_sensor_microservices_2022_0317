const express = require('express');
const router = express.Router();
const irrigationController = require('../controllers/irrigationController');
const { checkZoneAccess, checkRuleAccess } = require('../middleware/auth');

// Zone
router.get('/zones', irrigationController.getZones);
router.post('/zones', irrigationController.createZone);

// UKLONJENE RUTE koje nemaju funkcije:
// router.get('/zones/:zone_id', checkZoneAccess, irrigationController.getZoneById);
// router.put('/zones/:zone_id', checkZoneAccess, irrigationController.updateZone);
// router.delete('/zones/:zone_id', checkZoneAccess, irrigationController.deleteZone);

// Pravila (CRUD)
router.post('/rules', irrigationController.createRule);
router.get('/rules', irrigationController.getRules);

// Pravila sa ID - OSTAVLJAMO samo one koje imaju funkcije
router.get('/rules/:id', checkRuleAccess, irrigationController.getRuleById);
router.put('/rules/:id', checkRuleAccess, irrigationController.updateRule);
router.delete('/rules/:id', checkRuleAccess, irrigationController.deleteRule);

// Provera pravila (poziva Sensor Service) - zahteva proveru zone
router.post('/check', checkZoneAccess, irrigationController.checkRules);

// Ručno upravljanje - zahteva proveru zone
router.post('/manual/on', checkZoneAccess, irrigationController.manualIrrigation);
router.post('/manual/off', checkZoneAccess, irrigationController.manualIrrigationOff);

// Vremenska prognoza za zonu
router.get('/weather/:zone_id', irrigationController.getWeatherForecast);

// Višednevna vremenska prognoza za zonu
router.get('/forecast/:zone_id', irrigationController.getWeatherForecast7Days);

module.exports = router;