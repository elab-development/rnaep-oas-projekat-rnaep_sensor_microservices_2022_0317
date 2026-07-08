import axios from 'axios';

// API Gateway adresa
const API_BASE_URL = 'http://localhost:8080/api';

// Kreiraj axios instancu sa osnovnom konfiguracijom
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------- SENSOR SERVICE ----------
export const getLatestSensorReading = async (zoneId = 'ZONE_1') => {
  try {
    const response = await api.get(`/sensors/latest/${zoneId}`);
    return response.data;
  } catch (error) {
    console.error('Greška pri dohvatanju senzorskih podataka:', error);
    throw error;
  }
};

// ---------- IRRIGATION SERVICE ----------
export const getRules = async () => {
  try {
    const response = await api.get('/irrigation/rules');
    return response.data;
  } catch (error) {
    console.error('Greška pri dohvatanju pravila:', error);
    throw error;
  }
};

export const createRule = async (rule) => {
  try {
    const response = await api.post('/irrigation/rules', rule);
    return response.data;
  } catch (error) {
    console.error('Greška pri kreiranju pravila:', error);
    throw error;
  }
};

export const deleteRule = async (ruleId) => {
  try {
    const response = await api.delete(`/irrigation/rules/${ruleId}`);
    return response.data;
  } catch (error) {
    console.error('Greška pri brisanju pravila:', error);
    throw error;
  }
};

export const manualIrrigationOn = async (zoneId = 'ZONE_1', durationMinutes = 10) => {
  try {
    const response = await api.post('/irrigation/manual/on', {
      zone_id: zoneId,
      duration_minutes: durationMinutes,
    });
    return response.data;
  } catch (error) {
    console.error('Greška pri ručnom uključivanju:', error);
    throw error;
  }
};

export const manualIrrigationOff = async (zoneId = 'ZONE_1') => {
  try {
    const response = await api.post('/irrigation/manual/off', {
      zone_id: zoneId,
    });
    return response.data;
  } catch (error) {
    console.error('Greška pri ručnom isključivanju:', error);
    throw error;
  }
};

// ---------- ALERT SERVICE ----------
export const getAlertHistory = async (zoneId = 'ZONE_1') => {
  try {
    const response = await api.get(`/alerts/history/${zoneId}`);
    return response.data;
  } catch (error) {
    console.error('Greška pri dohvatanju istorije alerta:', error);
    throw error;
  }
};

export const resolveAlert = async (alertId) => {
  try {
    const response = await api.put(`/alerts/resolve/${alertId}`);
    return response.data;
  } catch (error) {
    console.error('Greška pri resolvovanju alerta:', error);
    throw error;
  }
};

// ---------- ZONE ----------
export const getZones = async () => {
  try {
    const response = await api.get('/irrigation/zones');
    return response.data;
  } catch (error) {
    console.error('Greška pri dohvatanju zona:', error);
    throw error;
  }
};

// ---------- WEATHER ----------
export const getWeatherForecast = async (zoneId = 'ZONE_1') => {
  try {
    const response = await api.get(`/irrigation/weather/${zoneId}`);
    return response.data;
  } catch (error) {
    console.error('Greška pri dohvatanju vremenske prognoze:', error);
    throw error;
  }
};

// ---------- ALERT SERVICE ----------
export const setThreshold = async (threshold) => {
  try {
    const response = await api.post('/alerts/thresholds', threshold);
    return response.data;
  } catch (error) {
    console.error('Greška pri postavljanju praga:', error);
    throw error;
  }
};

// ---------- WEATHER (7 DAYS) ----------
export const getWeatherForecast7Days = async (zoneId = 'ZONE_1') => {
  try {
    const response = await api.get(`/irrigation/forecast/${zoneId}`);
    return response.data;
  } catch (error) {
    console.error('Greška pri dohvatanju višednevne prognoze:', error);
    throw error;
  }
};

export default api;