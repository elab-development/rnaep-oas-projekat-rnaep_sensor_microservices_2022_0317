import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { getLatestSensorReading, getZones, getWeatherForecast } from '../services/api';
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
      
      // 1. Dohvati senzorske podatke
      const data = await getLatestSensorReading(selectedZone);
      console.log('📊 Sensor data for', selectedZone, ':', data);
      setSensorData(data);

      // 2. Dohvati zone
      const zonesData = await getZones();
      console.log('📊 Zones:', zonesData);
      setZones(zonesData);

      // 3. Dohvati vremensku prognozu
      try {
        const weather = await getWeatherForecast(selectedZone);
        console.log('🌤️ Weather data:', weather);
        setWeatherData(weather);
      } catch (weatherError) {
        console.error('Greška pri dohvatanju vremenske prognoze:', weatherError);
        setWeatherData(null);
      }

      // 3b. Dohvati višednevnu prognozu (7 dana)
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

  // ===== PROMENA ZONE (KADA KORISNIK IZABERE) =====
  const handleZoneChange = async (e) => {
    const newZone = e.target.value;
    setSelectedZone(newZone);
    
    // Promeni zonu u simulatoru
    await changeSimulatorZone(newZone);
    
    // Osveži podatke
    await fetchData();
  };

  // ===== PROVERA STATUSA SIMULATORA PRI UČITAVANJU =====
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

      <div className="zone-selector">
        <label><i className="fas fa-map-marker-alt"></i> Odaberi zonu:</label>
        <select 
          value={selectedZone} 
          onChange={handleZoneChange}  // <-- OVO JE IZMENJENO
        >
          {zones.map((zone, index) => (
            <option key={index} value={zone.zone_id}>
              {zone.name || zone.zone_id} ({zone.zone_id})
            </option>
          ))}
        </select>
        <button onClick={fetchData}>
          <i className="fas fa-sync"></i> Osveži
        </button>
        <span style={{ marginLeft: '20px', fontSize: '14px', color: '#718096' }}>
          <i className="fas fa-microchip"></i> Simulator: {simulatorStatus}
        </span>
      </div>

      {sensorData ? (
        <>
          <div className="sensor-card">
            <h2><i className="fas fa-microchip"></i> Senzorski podaci za zonu: {sensorData.zone_id}</h2>
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

          {/* Weather podaci */}
          <div className="sensor-card" style={{ marginTop: '20px' }}>
            <h2><i className="fas fa-cloud-sun"></i> Vremenska prognoza</h2>
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
                  <span className="value" style={{ fontSize: '18px', color: weatherData.forecast.willRain ? '#fc8181' : '#68d391' }}>
                    {weatherData.forecast.willRain ? '🌧️ Da' : '☀️ Ne'}
                  </span>
                </div>
                <div className="sensor-item">
                  <span className="label"><i className="fas fa-wind"></i> Brzina vetra:</span>
                  <span className="value">{weatherData.forecast.wind_speed} m/s</span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#718096' }}>
                <i className="fas fa-info-circle"></i> Podaci o vremenu nisu dostupni.
              </p>
            )}
          </div>

            {/* 7-day forecast */}
            <div className="sensor-card" style={{ marginTop: '20px' }}>
              <h2><i className="fas fa-calendar-alt"></i> 7-dnevna prognoza</h2>
              {forecast7Days && forecast7Days.forecast && forecast7Days.forecast.days ? (
                <div className="forecast-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  {forecast7Days.forecast.days.map((day, index) => (
                    <div key={index} className="forecast-day" style={{
                      background: 'rgba(255,255,255,0.04)',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#a0aec0', fontWeight: '500' }}>
                        {index === 0 ? 'Danas' : new Date(day.date).toLocaleDateString('sr-RS', { weekday: 'short' })}
                      </div>
                      <div style={{ fontSize: '32px', margin: '8px 0' }}>{day.weather_icon}</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
                        {day.temperature_max}°
                      </div>
                      <div style={{ fontSize: '14px', color: '#a0aec0' }}>
                        {day.temperature_min}°
                      </div>
                      <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                        💧 {day.precipitation} mm
                      </div>
                      <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '2px' }}>
                        {day.weather_description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#718096' }}>
                  <i className="fas fa-info-circle"></i> 7-dnevna prognoza nije dostupna.
                </p>
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