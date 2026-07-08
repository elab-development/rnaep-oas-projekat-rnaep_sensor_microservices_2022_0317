import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getLatestSensorReading, getZones, getWeatherForecast, getWeatherForecast7Days } from '../services/api';

const Dashboard = () => {
  const [sensorData, setSensorData] = useState(null);
  const [zones, setZones] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('ZONE_1');
  const [simulatorStatus, setSimulatorStatus] = useState('Nepoznat');
  const [forecast7Days, setForecast7Days] = useState(null);

  // ===== FUNKCIJA ZA PROMENU ZONE U SIMULATORU =====
  const changeSimulatorZone = async (zoneId) => {
    try {
      const response = await axios.post('http://localhost:3005/set-zone', { 
        zone_id: zoneId 
      }, {
        timeout: 3000
      });
      console.log('🔄 Simulator odgovor:', response.data);
      setSimulatorStatus(`Zona: ${response.data.current_zone}`);
      return true;
    } catch (error) {
      console.error('❌ Greška pri promeni zone u simulatoru:', error.message);
      if (error.code === 'ECONNREFUSED') {
        setSimulatorStatus('❌ Simulator nije pokrenut (port 3005)');
      } else {
        setSimulatorStatus('❌ Greška pri komunikaciji sa simulatorom');
      }
      return false;
    }
  };

  // ===== DOHVATANJE PODATAKA =====
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const data = await getLatestSensorReading(selectedZone);
      console.log('📊 Sensor data for', selectedZone, ':', data);
      setSensorData(data);

      const zonesData = await getZones();
      console.log('📊 Zones:', zonesData);
      setZones(zonesData);

      try {
        const weather = await getWeatherForecast(selectedZone);
        console.log('🌤️ Weather data:', weather);
        setWeatherData(weather);
      } catch (weatherError) {
        console.error('Greška pri dohvatanju vremenske prognoze:', weatherError);
        setWeatherData(null);
      }

      try {
        const forecast7 = await getWeatherForecast7Days(selectedZone);
        console.log('📅 7-day forecast:', forecast7);
        setForecast7Days(forecast7);
      } catch (forecastError) {
        console.error('Greška pri dohvatanju višednevne prognoze:', forecastError);
        setForecast7Days(null);
      }
      
    } catch (error) {
      console.error('Greška pri dohvatanju podataka:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== PROMENA ZONE =====
  const handleZoneChange = async (e) => {
    const newZone = e.target.value;
    setSelectedZone(newZone);
    await changeSimulatorZone(newZone);
    await fetchData();
  };

  // ===== PROVERA STATUSA SIMULATORA =====
  const checkSimulatorStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3005/health', { timeout: 2000 });
      setSimulatorStatus(`✅ Radi (zona: ${response.data.zone_id})`);
    } catch (error) {
      setSimulatorStatus('❌ Simulator nije pokrenut (port 3005)');
    }
  };

  // ===== USEFFECT =====
  useEffect(() => {
    checkSimulatorStatus();
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  if (loading && !sensorData) {
    return <div className="loading">Učitavanje...</div>;
  }

  return (
    <div className="dashboard">
      <h1><i className="fas fa-seedling"></i> Pametno navodnjavanje - Dashboard</h1>

      {/* ZONE SELECTOR */}
      <div className="zone-selector">
        <label><i className="fas fa-map-marker-alt"></i> Odaberi zonu:</label>
        <select value={selectedZone} onChange={handleZoneChange}>
          {zones.map((zone, index) => (
            <option key={index} value={zone.zone_id}>
              {zone.name || zone.zone_id} ({zone.zone_id})
            </option>
          ))}
        </select>
        <button onClick={fetchData}>
          <i className="fas fa-sync"></i> Osveži
        </button>
        <span className="simulator-status">
          <i className="fas fa-microchip"></i> Simulator: {simulatorStatus}
        </span>
      </div>

      {sensorData ? (
        <>
          {/* ===== RED 1: DVE KOLONE ===== */}
          <div className="dashboard-two-columns">
            {/* Leva kolona: Senzorski podaci */}
            <div className="sensor-card">
              <h2><i className="fas fa-microchip"></i> Senzorski podaci</h2>
              <div className="sensor-grid">
                <div className="sensor-item">
                  <span className="label"><i className="fas fa-tint"></i> Vlažnost zemljišta:</span>
                  <span className="value">{sensorData.moisture}%</span>
                </div>
                <div className="sensor-item">
                  <span className="label"><i className="fas fa-thermometer-half"></i> Temperatura:</span>
                  <span className="value">{sensorData.temperature}°C</span>
                </div>
                <div className="sensor-item">
                  <span className="label"><i className="fas fa-wind"></i> Vlažnost vazduha:</span>
                  <span className="value">{sensorData.humidity}%</span>
                </div>
                <div className="sensor-item">
                  <span className="label"><i className="fas fa-clock"></i> Vreme merenja:</span>
                  <span className="value">{new Date(sensorData.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Desna kolona: Trenutno vreme */}
            <div className="sensor-card">
              <h2><i className="fas fa-cloud-sun"></i> Trenutno vreme</h2>
              {weatherData && weatherData.forecast ? (
                <div className="sensor-grid">
                  <div className="sensor-item">
                    <span className="label"><i className="fas fa-map-marker-alt"></i> Lokacija:</span>
                    <span className="value" style={{ fontSize: '18px' }}>{weatherData.forecast.city}</span>
                  </div>
                  <div className="sensor-item">
                    <span className="label"><i className="fas fa-thermometer-half"></i> Temperatura:</span>
                    <span className="value">{weatherData.forecast.temperature}°C</span>
                  </div>
                  <div className="sensor-item">
                    <span className="label"><i className="fas fa-tint"></i> Vlažnost vazduha:</span>
                    <span className="value">{weatherData.forecast.humidity}%</span>
                  </div>
                  <div className="sensor-item">
                    <span className="label"><i className="fas fa-cloud"></i> Vreme:</span>
                    <span className="value" style={{ fontSize: '18px' }}>{weatherData.forecast.weather}</span>
                  </div>
                  <div className="sensor-item">
                    <span className="label"><i className="fas fa-umbrella"></i> Kiša:</span>
                    <span className="value" style={{ fontSize: '18px', color: weatherData.forecast.willRain ? '#ef4444' : '#22c55e' }}>
                      {weatherData.forecast.willRain ? '🌧️ Da' : '☀️ Ne'}
                    </span>
                  </div>
                  <div className="sensor-item">
                    <span className="label"><i className="fas fa-wind"></i> Brzina vetra:</span>
                    <span className="value">{weatherData.forecast.wind_speed} m/s</span>
                  </div>
                </div>
              ) : (
                <p className="no-data">Podaci o vremenu nisu dostupni.</p>
              )}
            </div>
          </div>

          {/* ===== RED 2: 7-DNEVNA PROGNOZA (PREKO CELE ŠIRINE) ===== */}
          <div className="sensor-card forecast-full-width">
            <h2><i className="fas fa-calendar-alt"></i> 7-dnevna prognoza</h2>
            {forecast7Days && forecast7Days.forecast && forecast7Days.forecast.days ? (
              <div className="forecast-grid">
                {forecast7Days.forecast.days.map((day, index) => (
                  <div key={index} className="forecast-day">
                    <div className="day-name">
                      {index === 0 ? 'Danas' : new Date(day.date).toLocaleDateString('sr-RS', { weekday: 'short' })}
                    </div>
                    <div className="day-icon">{day.weather_icon}</div>
                    <div className="day-temp-max">{day.temperature_max}°</div>
                    <div className="day-temp-min">{day.temperature_min}°</div>
                    <div className="day-precip">💧 {day.precipitation} mm</div>
                    <div className="day-desc">{day.weather_description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">7-dnevna prognoza nije dostupna.</p>
            )}
          </div>
        </>
      ) : (
        <p className="no-data">Nema dostupnih podataka za ovu zonu.</p>
      )}
    </div>
  );
};

export default Dashboard;