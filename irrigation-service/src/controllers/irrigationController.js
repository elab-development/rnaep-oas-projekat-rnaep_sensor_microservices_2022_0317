const { pool } = require('../models/database');
const { simulateActuator } = require('../services/actuatorService');
const { getWeatherForecast } = require('../services/weatherClient');

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
    console.error('❌ IRRIGATION: Greška u createRule:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRules = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM irrigation_rules ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ IRRIGATION: Greška u getRules:', error);
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
    console.error('❌ IRRIGATION: Greška u getRuleById:', error);
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
    console.error('❌ IRRIGATION: Greška u updateRule:', error);
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
    console.error('❌ IRRIGATION: Greška u deleteRule:', error);
    res.status(500).json({ error: error.message });
  }
};

// Provera pravila (kad stigne novo očitanje)
exports.checkRules = async (req, res) => {
  try {
    // ===== POSTOJEĆI LOGOVI =====
    console.log('='.repeat(50));
    console.log('📥 IRRIGATION: Primljen zahtev za proveru pravila');
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('🔑 zone_id:', req.body.zone_id);
    console.log('💧 moisture:', req.body.moisture);
    console.log('='.repeat(50));

    const { zone_id, moisture } = req.body;

    // ===== DOHVATI ZONU SA KOORDINATAMA =====
    const zoneResult = await pool.query(
      `SELECT zone_id, name, latitude, longitude, city FROM zones WHERE zone_id = $1`,
      [zone_id]
    );

    if (zoneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Zona nije pronađena' });
    }

    const zone = zoneResult.rows[0];

    // ===== DOHVATI VREMENSKU PROGNOZU =====
    const forecast = await getWeatherForecast(zone.latitude, zone.longitude, zone.city);

    console.log(`🔍 IRRIGATION: Prognoza za zonu "${zone.name}":`);
    console.log(`   🌡️ Temperatura: ${forecast.temperature}°C`);
    console.log(`   💨 Vlažnost vazduha: ${forecast.humidity}%`);
    console.log(`   🌧️ Kiša: ${forecast.willRain ? 'DA' : 'NE'}`);

    // ===== PRONAĐI AKTIVNA PRAVILA =====
    const rules = await pool.query(
      `SELECT * FROM irrigation_rules 
       WHERE zone_id = $1 AND is_active = true`,
      [zone_id]
    );

    if (rules.rows.length === 0) {
      console.log('ℹ️ IRRIGATION: Nema aktivnih pravila za ovu zonu');
      return res.json({ 
        message: 'Nema aktivnih pravila za ovu zonu',
        forecast: forecast // Prosleđujemo prognozu u odgovor
      });
    }

    // ===== PROVERI SVAKO PRAVILO =====
    const triggeredRules = [];
    for (const rule of rules.rows) {
      console.log(`🔍 IRRIGATION: Proveravam pravilo "${rule.name}" (prag: ${rule.moisture_threshold}%, vlažnost: ${moisture}%)`);
      
      if (moisture < rule.moisture_threshold) {
        // ===== PROVERI DA LI ĆE PADATI KIŠA =====
        if (forecast.willRain) {
          console.log(`☔ IRRIGATION: Kiša se očekuje, zalivanje ODLOŽENO za zonu ${zone_id}`);
          triggeredRules.push({
            rule_id: rule.rule_id,
            name: rule.name,
            action: 'ZALIVANJE ODLOŽENO (kiša)',
            duration: rule.irrigation_duration_min,
            reason: 'Očekuje se kiša'
          });
          continue; // Preskoči zalivanje
        }

        // ===== AKTIVIRAJ ZALIVANJE =====
        console.log(`✅ IRRIGATION: Pravilo aktivirano! Zalivanje na ${rule.irrigation_duration_min} min`);
        await simulateActuator(zone_id, rule.irrigation_duration_min);
        triggeredRules.push({
          rule_id: rule.rule_id,
          name: rule.name,
          action: 'ZALIVANJE POKRENUTO',
          duration: rule.irrigation_duration_min,
          reason: `Vlažnost (${moisture}%) < prag (${rule.moisture_threshold}%)`
        });
      }
    }

    console.log(`✅ IRRIGATION: Provera završena, aktivirano ${triggeredRules.length} pravila`);
    res.json({
      message: 'Provera pravila završena',
      checked_rules: rules.rows.length,
      triggered_rules: triggeredRules,
      forecast: forecast // Prosleđujemo prognozu u odgovor
    });

  } catch (error) {
    console.error('❌❌❌ IRRIGATION: GREŠKA U checkRules ❌❌❌');
    console.error('   Poruka:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
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
    console.error('❌ IRRIGATION: Greška u manualIrrigation:', error);
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
    console.error('❌ IRRIGATION: Greška u manualIrrigationOff:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dohvati sve zone
exports.getZones = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zones ORDER BY name');
    console.log(`📋 IRRIGATION: Dohvaćeno ${result.rows.length} zona`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ IRRIGATION: Greška u getZones:', error);
    res.status(500).json({ error: error.message });
  }
};

// Kreiraj novu zonu
exports.createZone = async (req, res) => {
  try {
    const { 
      parcel_id, name, sensor_id, valve_id,
      latitude, longitude, city 
    } = req.body;

    // Ako zone_id nije poslat, generiši ga
    let zone_id = req.body.zone_id;
    if (!zone_id) {
      const lastZone = await pool.query(
        `SELECT zone_id FROM zones ORDER BY created_at DESC LIMIT 1`
      );
      if (lastZone.rows.length === 0) {
        zone_id = 'ZONE_1';
      } else {
        const lastId = lastZone.rows[0].zone_id;
        const num = parseInt(lastId.split('_')[1]) + 1;
        zone_id = `ZONE_${num}`;
      }
    }

    // Default koordinate (Beograd) ako nisu poslate
    const lat = latitude || 44.7866;
    const lon = longitude || 20.4489;
    const cityName = city || 'Belgrade';

    console.log(`📝 IRRIGATION: Kreiram zonu "${name}" sa zone_id: ${zone_id}`);
    console.log(`   📍 Lokacija: ${cityName} (${lat}, ${lon})`);

    const result = await pool.query(
      `INSERT INTO zones 
       (zone_id, parcel_id, name, sensor_id, valve_id, latitude, longitude, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [zone_id, parcel_id, name, sensor_id, valve_id, lat, lon, cityName]
    );

    console.log(`✅ IRRIGATION: Zona kreirana sa ID: ${result.rows[0].zone_id}`);
    res.status(201).json({
      message: 'Zona uspešno kreirana',
      zone: result.rows[0]
    });
  } catch (error) {
    console.error('❌ IRRIGATION: Greška u createZone:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dohvati vremensku prognozu za zonu
exports.getWeatherForecast = async (req, res) => {
  try {
    const { zone_id } = req.params;

    // Dohvati zonu sa koordinatama
    const zoneResult = await pool.query(
      `SELECT zone_id, name, latitude, longitude, city FROM zones WHERE zone_id = $1`,
      [zone_id]
    );

    if (zoneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Zona nije pronađena' });
    }

    const zone = zoneResult.rows[0];

    // Dohvati vremensku prognozu
    const forecast = await getWeatherForecast(zone.latitude, zone.longitude, zone.city);

    res.json({
      zone_id: zone.zone_id,
      zone_name: zone.name,
      forecast: forecast
    });

  } catch (error) {
    console.error('❌ IRRIGATION: Greška u getWeatherForecast:', error);
    res.status(500).json({ error: error.message });
  }
};