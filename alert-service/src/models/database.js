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
    // Tabela: thresholds
    await pool.query(`
      CREATE TABLE IF NOT EXISTS thresholds (
        threshold_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        zone_id VARCHAR(50) NOT NULL UNIQUE,
        critical_moisture DECIMAL(5,2) NOT NULL CHECK (critical_moisture BETWEEN 0 AND 100),
        warning_moisture DECIMAL(5,2) NOT NULL CHECK (warning_moisture BETWEEN 0 AND 100),
        notification_channels TEXT[] DEFAULT ARRAY['sms', 'email'],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela: alerts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        zone_id VARCHAR(50) NOT NULL,
        type VARCHAR(30) NOT NULL CHECK (type IN ('CRITICAL', 'WARNING', 'DROUGHT')),
        moisture_value DECIMAL(5,2) NOT NULL,
        threshold_value DECIMAL(5,2) NOT NULL,
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela: notification_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID NOT NULL REFERENCES alerts(alert_id) ON DELETE CASCADE,
        channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'email', 'push')),
        recipient VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT
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