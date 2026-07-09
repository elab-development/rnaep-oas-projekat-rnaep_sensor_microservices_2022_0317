const SensorReading = require('../models/SensorReading');
const { forwardToIrrigation, forwardToAlert } = require('../services/forwardService');
const crypto = require('crypto');

// Prijem podataka sa senzora
exports.createReading = async (req, res) => {
  try {
    const { sensor_id, zone_id, moisture, temperature, humidity, timestamp } = req.body;

    // Validacija
    if (!sensor_id || !zone_id) {
      return res.status(400).json({
        error: 'sensor_id i zone_id su obavezni'
      });
    }

    if (moisture === undefined || moisture < 0 || moisture > 100) {
      return res.status(400).json({
        error: 'moisture mora biti izmedju 0 i 100'
      });
    }

    // Kreiraj novi dokument
    const reading = new SensorReading({
      sensor_id,
      zone_id,
      moisture,
      temperature,
      humidity,
      timestamp: timestamp || new Date()
    });

    // Sačuvaj u MongoDB
    await reading.save();

    // ✅ PROSLEDI KA IRRIGATION SERVICE (asinhrono - ne čekamo odgovor)
    forwardToIrrigation(reading).catch(err => {
      console.error('Greška pri prosleđivanju ka Irrigation:', err.message);
    });

    // ✅ PROSLEDI KA ALERT SERVICE (asinhrono - ne čekamo odgovor)
    forwardToAlert(reading).catch(err => {
      console.error('Greška pri prosleđivanju ka Alert:', err.message);
    });

    res.status(201).json({
      message: 'Očitavanje uspešno sačuvano',
      id: reading._id,
      data: reading
    });

  } catch (error) {
    console.error('Greška pri čuvanju očitavanja:', error);
    res.status(500).json({
      error: 'Interna greška servera',
      details: error.message
    });
  }
};

// Dohvati sva očitavanja za zonu (sa paginacijom)
exports.getReadingsByZone = async (req, res) => {
  try {
    const { zone_id } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    const readings = await SensorReading.find({ zone_id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await SensorReading.countDocuments({ zone_id });

    res.json({
      data: readings,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + readings.length < total
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvati poslednje očitavanje za zonu
exports.getLatestReading = async (req, res) => {
  try {
    const { zone_id } = req.params;

    const reading = await SensorReading.findOne({ zone_id })
      .sort({ timestamp: -1 });

    if (!reading) {
      return res.status(404).json({
        error: 'Nema očitavanja za ovu zonu'
      });
    }

    res.json(reading);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvati sve zone (distinct)
exports.getZones = async (req, res) => {
  try {
    const zones = await SensorReading.distinct('zone_id');
    res.json({ zones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};