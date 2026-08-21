const { pool } = require('../models/database');

async function checkThresholdAccess(req, res, next) {
  try {
    const zoneId = req.params.zone_id || req.body.zone_id;
    
    if (!zoneId) {
      return res.status(400).json({ error: 'zone_id je obavezan' });
    }

    const result = await pool.query(
      'SELECT zone_id FROM thresholds WHERE zone_id = $1',
      [zoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prag nije pronađen' });
    }

    next();
  } catch (error) {
    console.error('IDOR provera greška:', error);
    res.status(500).json({ error: 'Greška pri proveri autorizacije' });
  }
}

async function checkAlertAccess(req, res, next) {
  try {
    const alertId = req.params.id;
    
    if (!alertId) {
      return res.status(400).json({ error: 'alert_id je obavezan' });
    }

    const result = await pool.query(
      'SELECT alert_id FROM alerts WHERE alert_id = $1',
      [alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert nije pronađen' });
    }

    next();
  } catch (error) {
    console.error('IDOR provera greška:', error);
    res.status(500).json({ error: 'Greška pri proveri autorizacije' });
  }
}

module.exports = {
  checkThresholdAccess,
  checkAlertAccess
};