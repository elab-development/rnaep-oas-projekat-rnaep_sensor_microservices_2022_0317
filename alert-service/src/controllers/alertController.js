const { pool } = require('../models/database');
const { sendNotification } = require('../services/notificationService');

// Postavi prag za zonu
exports.setThreshold = async (req, res) => {
  try {
    const { zone_id, critical_moisture, warning_moisture, notification_channels } = req.body;

    const result = await pool.query(
      `INSERT INTO thresholds (zone_id, critical_moisture, warning_moisture, notification_channels)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (zone_id) 
       DO UPDATE SET 
         critical_moisture = EXCLUDED.critical_moisture,
         warning_moisture = EXCLUDED.warning_moisture,
         notification_channels = EXCLUDED.notification_channels,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [zone_id, critical_moisture, warning_moisture, notification_channels || ['sms', 'email']]
    );

    res.status(201).json({
      message: 'Prag uspešno postavljen',
      threshold: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvati prag za zonu
exports.getThreshold = async (req, res) => {
  try {
    const { zone_id } = req.params;
    const result = await pool.query('SELECT * FROM thresholds WHERE zone_id = $1', [zone_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prag nije pronađen za ovu zonu' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Provera alerta (kad stigne novo očitanje)
exports.checkAlerts = async (req, res) => {
  try {
    const { zone_id, moisture } = req.body;

    // Dohvati prag za ovu zonu
    const threshold = await pool.query('SELECT * FROM thresholds WHERE zone_id = $1', [zone_id]);

    if (threshold.rows.length === 0) {
      return res.json({ 
        message: 'Nema postavljenih pragova za ovu zonu',
        alerts: []
      });
    }

    const t = threshold.rows[0];
    const alerts = [];

    // Proveri CRITICAL prag
    if (moisture < t.critical_moisture) {
      const alert = await pool.query(
        `INSERT INTO alerts (zone_id, type, moisture_value, threshold_value, message)
         VALUES ($1, 'CRITICAL', $2, $3, $4) RETURNING *`,
        [zone_id, moisture, t.critical_moisture, `❗ KRITIČNO: Vlažnost ${moisture}% je ispod kritičnog praga ${t.critical_moisture}%`]
      );
      alerts.push(alert.rows[0]);

      // Pošalji notifikaciju
      await sendNotification(zone_id, alert.rows[0], t.notification_channels);
    }

    // Proveri WARNING prag
    else if (moisture < t.warning_moisture) {
      const alert = await pool.query(
        `INSERT INTO alerts (zone_id, type, moisture_value, threshold_value, message)
         VALUES ($1, 'WARNING', $2, $3, $4) RETURNING *`,
        [zone_id, moisture, t.warning_moisture, `⚠️ UPOZORENJE: Vlažnost ${moisture}% je ispod upozoravajućeg praga ${t.warning_moisture}%`]
      );
      alerts.push(alert.rows[0]);

      // Pošalji notifikaciju
      await sendNotification(zone_id, alert.rows[0], t.notification_channels);
    }

    res.json({
      message: 'Provera alerta završena',
      alerts: alerts
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvati istoriju alerta za zonu
exports.getAlertHistory = async (req, res) => {
  try {
    const { zone_id } = req.params;
    const { limit = 100, resolved = false } = req.query;

    let query = 'SELECT * FROM alerts WHERE zone_id = $1';
    const params = [zone_id];

    if (resolved === 'true') {
      query += ' AND is_resolved = true';
    } else if (resolved === 'false') {
      query += ' AND is_resolved = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resolvuj alert
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE alerts SET is_resolved = true, resolved_at = CURRENT_TIMESTAMP
       WHERE alert_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert nije pronađen' });
    }

    res.json({
      message: 'Alert uspešno resolvovan',
      alert: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvati sve zone sa pragovima
exports.getZonesWithThresholds = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM thresholds ORDER BY zone_id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};