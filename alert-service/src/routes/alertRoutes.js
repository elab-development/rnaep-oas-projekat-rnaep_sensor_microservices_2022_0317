const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { checkThresholdAccess, checkAlertAccess } = require('../middleware/auth');

// Pragovi
router.post('/thresholds', alertController.setThreshold);
router.get('/thresholds', alertController.getZonesWithThresholds);

// Pragovi sa ID (zahtevaju proveru)
router.get('/thresholds/:zone_id', checkThresholdAccess, alertController.getThreshold);

// Provera alerta (poziva Sensor Service)
router.post('/check', alertController.checkAlerts);

// Istorija alerta
router.get('/history/:zone_id', alertController.getAlertHistory);

// Resolvuj alert - zahteva proveru
router.put('/resolve/:id', checkAlertAccess, alertController.resolveAlert);

module.exports = router;