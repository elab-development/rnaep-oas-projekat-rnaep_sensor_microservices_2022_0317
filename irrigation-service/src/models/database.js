const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// Kreiraj tabele ako ne postoje
const createTables = async () => {
  try {
    // Tabela: zone
    await pool.query(`
      CREATE TABLE IF NOT EXISTS zones (
        zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parcel_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        sensor_id VARCHAR(50) NOT NULL,
        valve_id VARCHAR(50) NOT NULL,
        auto_mode BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela: irrigation_rules
    await pool.query(`
      CREATE TABLE IF NOT EXISTS irrigation_rules (
        rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        moisture_threshold DECIMAL(5,2) NOT NULL CHECK (moisture_threshold BETWEEN 0 AND 100),
        irrigation_duration_min INTEGER NOT NULL CHECK (irrigation_duration_min > 0),
        use_weather_forecast BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela: override_log
    await pool.query(`
      CREATE TABLE IF NOT EXISTS override_logs (
        override_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        zone_id UUID NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
        rule_id UUID REFERENCES irrigation_rules(rule_id) ON DELETE SET NULL,
        action VARCHAR(20) NOT NULL CHECK (action IN ('ON', 'OFF', 'AUTO')),
        triggered_by VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);

    console.log('✅ Tabele kreirane (ili već postoje)');
  } catch (error) {
    console.error('❌ Greška pri kreiranju tabela:', error);
  }
};

module.exports = {
  pool,
  createTables
};