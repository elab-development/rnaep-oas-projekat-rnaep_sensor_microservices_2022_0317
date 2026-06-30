const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema({
  sensor_id: {
    type: String,
    required: true,
    index: true
  },
  zone_id: {
    type: String,
    required: true,
    index: true
  },
  moisture: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  temperature: {
    type: Number,
    required: false
  },
  humidity: {
    type: Number,
    required: false,
    min: 0,
    max: 100
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
});

// Indeksi za brže pretrage
SensorReadingSchema.index({ sensor_id: 1, timestamp: -1 });
SensorReadingSchema.index({ zone_id: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', SensorReadingSchema);