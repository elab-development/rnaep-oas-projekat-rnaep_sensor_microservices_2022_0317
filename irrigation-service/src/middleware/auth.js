const { pool } = require('../models/database');

async function checkZoneAccess(req, res, next) {
  try {
    const zoneId = req.params.zone_id || req.body.zone_id;
    
    if (!zoneId) {
      return res.status(400).json({ error: 'zone_id je obavezan' });
    }

    // Proveri da li zona postoji u bazi
    const result = await pool.query(
      'SELECT zone_id FROM zones WHERE zone_id = $1',
      [zoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Zona nije pronađena' });
    }

    // U realnom sistemu, ovde bi se proveravalo da li je zone_id povezana sa korisnikom
    // Na primer: SELECT * FROM zones WHERE zone_id = $1 AND user_id = $2
    // Pošto nemamo autentikaciju, preskačemo taj deo

    next();
  } catch (error) {
    console.error('IDOR provera greška:', error);
    res.status(500).json({ error: 'Greška pri proveri autorizacije' });
  }
}

async function checkRuleAccess(req, res, next) {
  try {
    const ruleId = req.params.id || req.body.rule_id;
    
    if (!ruleId) {
      return res.status(400).json({ error: 'rule_id je obavezan' });
    }

    const result = await pool.query(
      'SELECT rule_id FROM irrigation_rules WHERE rule_id = $1',
      [ruleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pravilo nije pronađeno' });
    }

    next();
  } catch (error) {
    console.error('IDOR provera greška:', error);
    res.status(500).json({ error: 'Greška pri proveri autorizacije' });
  }
}

module.exports = {
  checkZoneAccess,
  checkRuleAccess
};