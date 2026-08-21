const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { checkThresholdAccess, checkAlertAccess } = require('../middleware/auth');

// Pragovi
router.post('/thresholds', alertController.setThreshold);
router.get('/thresholds/:zone_id', alertController.getThreshold);
router.get('/thresholds', alertController.getZonesWithThresholds);

// Provera alerta (poziva Sensor Service)
router.post('/check', alertController.checkAlerts);

// Istorija alerta
router.get('/history/:zone_id', alertController.getAlertHistory);

// Resolvuj alert
router.put('/resolve/:id', alertController.resolveAlert);

// Pragovi
router.get('/thresholds/:zone_id', checkThresholdAccess, alertController.getThreshold);
router.put('/thresholds/:zone_id', checkThresholdAccess, alertController.updateThreshold);
router.delete('/thresholds/:zone_id', checkThresholdAccess, alertController.deleteThreshold);

// Alerti
router.put('/resolve/:id', checkAlertAccess, alertController.resolveAlert);

module.exports = router;