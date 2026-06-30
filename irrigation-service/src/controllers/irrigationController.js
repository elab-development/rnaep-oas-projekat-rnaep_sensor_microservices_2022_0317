const { pool } = require('../models/database');
const { simulateActuator } = require('../services/actuatorService');

// CRUD za pravila
exports.createRule = async (req, res) => {
  try {
    const { zone_id, name, moisture_threshold, irrigation_duration_min, use_weather_forecast } = req.body;

    const result = await pool.query(
      `INSERT INTO irrigation_rules 
       (zone_id, name, moisture_threshold, irrigation_duration_min, use_weather_forecast) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [zone_id, name, moisture_threshold, irrigation_duration_min, use_weather_forecast || false]
    );

    res.status(201).json({
      message: 'Pravilo uspešno kreirano',
      rule: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRules = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM irrigation_rules ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM irrigation_rules WHERE rule_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pravilo nije pronađeno' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, moisture_threshold, irrigation_duration_min, use_weather_forecast, is_active } = req.body;

    const result = await pool.query(
      `UPDATE irrigation_rules 
       SET name = $1, moisture_threshold = $2, irrigation_duration_min = $3, 
           use_weather_forecast = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
       WHERE rule_id = $6 RETURNING *`,
      [name, moisture_threshold, irrigation_duration_min, use_weather_forecast, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pravilo nije pronađeno' });
    }

    res.json({
      message: 'Pravilo uspešno ažurirano',
      rule: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM irrigation_rules WHERE rule_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pravilo nije pronađeno' });
    }

    res.json({ message: 'Pravilo uspešno obrisano' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Provera pravila (kad stigne novo očitanje)
exports.checkRules = async (req, res) => {
  try {
    const { zone_id, moisture } = req.body;

    // Pronađi aktivna pravila za ovu zonu
    const rules = await pool.query(
      `SELECT * FROM irrigation_rules 
       WHERE zone_id = $1 AND is_active = true`,
      [zone_id]
    );

    if (rules.rows.length === 0) {
      return res.json({ message: 'Nema aktivnih pravila za ovu zonu' });
    }

    // Proveri svako pravilo
    const triggeredRules = [];
    for (const rule of rules.rows) {
      if (moisture < rule.moisture_threshold) {
        // Aktiviraj zalivanje
        await simulateActuator(zone_id, rule.irrigation_duration_min);
        triggeredRules.push({
          rule_id: rule.rule_id,
          name: rule.name,
          action: 'ZALIVANJE POKRENUTO',
          duration: rule.irrigation_duration_min
        });
      }
    }

    res.json({
      message: 'Provera pravila završena',
      checked_rules: rules.rows.length,
      triggered_rules: triggeredRules
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ručno uključi zalivanje
exports.manualIrrigation = async (req, res) => {
  try {
    const { zone_id, duration_minutes } = req.body;

    // Simuliraj aktuator
    await simulateActuator(zone_id, duration_minutes || 10, 'manual');

    // Zabeleži u override_log
    await pool.query(
      `INSERT INTO override_logs (zone_id, action, triggered_by, expires_at)
       VALUES ($1, 'ON', 'manual', NOW() + INTERVAL '1 hour')`,
      [zone_id]
    );

    res.json({
      message: `✅ Zalivanje ručno uključeno za zonu ${zone_id} na ${duration_minutes || 10} minuta`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ručno isključi zalivanje
exports.manualIrrigationOff = async (req, res) => {
  try {
    const { zone_id } = req.body;

    await pool.query(
      `INSERT INTO override_logs (zone_id, action, triggered_by)
       VALUES ($1, 'OFF', 'manual')`,
      [zone_id]
    );

    res.json({
      message: `⛔ Zalivanje ručno isključeno za zonu ${zone_id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvati sve zone
exports.getZones = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zones ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Kreiraj novu zonu
exports.createZone = async (req, res) => {
  try {
    const { parcel_id, name, sensor_id, valve_id } = req.body;

    const result = await pool.query(
      `INSERT INTO zones (parcel_id, name, sensor_id, valve_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [parcel_id, name, sensor_id, valve_id]
    );

    res.status(201).json({
      message: 'Zona uspešno kreirana',
      zone: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};