import React, { useState, useEffect } from 'react';
import { getAlertHistory, resolveAlert, getZones, setThreshold } from '../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('ZONE_1');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [thresholdData, setThresholdData] = useState({
    critical_moisture: 20,
    warning_moisture: 35,
    notification_channels: ['sms', 'email']
  });

  // ===== DOHVATANJE PODATAKA =====
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Dohvati zone (za dropdown)
      const zonesData = await getZones();
      setZones(zonesData);
      
      // Ako nema izabrane zone, postavi prvu
      if (zonesData.length > 0) {
        const exists = zonesData.some(z => z.zone_id === selectedZone);
        if (!exists) {
          setSelectedZone(zonesData[0].zone_id);
        }
      }

      // Dohvati istoriju alerta za odabranu zonu
      const data = await getAlertHistory(selectedZone);
      setAlerts(data);
      
    } catch (error) {
      console.error('Greška pri dohvatanju alerta:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== RESOLVOVANJE ALERTA =====
  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
      setMessage('✅ Alert uspešno resolvovan!');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Greška pri resolvovanju alerta.');
      console.error(error);
    }
  };

  // ===== POSTAVLJANJE PRAGA =====
  const handleSetThreshold = async () => {
    try {
      await setThreshold({
        zone_id: selectedZone,
        critical_moisture: thresholdData.critical_moisture,
        warning_moisture: thresholdData.warning_moisture,
        notification_channels: thresholdData.notification_channels
      });
      setMessage(`✅ Prag uspešno postavljen za zonu ${selectedZone}!`);
      setShowThresholdForm(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Greška pri postavljanju praga.');
      console.error(error);
    }
  };

  // ===== PROMENA ZONE =====
  const handleZoneChange = (e) => {
    setSelectedZone(e.target.value);
  };

  // ===== PROMENA INPUTA ZA PRAG =====
  const handleThresholdChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setThresholdData(prev => ({
        ...prev,
        notification_channels: checked 
          ? [...prev.notification_channels, name]
          : prev.notification_channels.filter(ch => ch !== name)
      }));
    } else {
      setThresholdData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    }
  };

  return (
    <div className="alerts">
      <h1>🔔 Istorija alerta</h1>

      {message && <div className="message">{message}</div>}

      {/* ===== KONTROLE ===== */}
      <div className="zone-selector" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <label><i className="fas fa-map-marker-alt"></i> Odaberi zonu:</label>
        <select 
          value={selectedZone} 
          onChange={handleZoneChange}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.06)',
            color: '#e8edf2',
            fontSize: '14px',
            minWidth: '160px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {zones.map((zone) => (
            <option key={zone.zone_id} value={zone.zone_id}>
              {zone.name || zone.zone_id} ({zone.zone_id})
            </option>
          ))}
        </select>
        
        <button onClick={fetchData} className="btn-refresh">
          <i className="fas fa-sync"></i> Osveži
        </button>

        <button 
          onClick={() => setShowThresholdForm(!showThresholdForm)} 
          className="btn-create"
          style={{ 
            background: '#4a5568',
            boxShadow: '0 4px 12px rgba(74, 85, 104, 0.3)'
          }}
        >
          <i className="fas fa-sliders-h"></i> {showThresholdForm ? 'Sakrij prag' : 'Postavi prag'}
        </button>
      </div>

      {/* ===== FORMA ZA POSTAVLJANJE PRAGA ===== */}
      {showThresholdForm && (
        <div className="create-rule" style={{ marginBottom: '20px' }}>
          <h3><i className="fas fa-sliders-h"></i> Postavljanje praga za zonu: {selectedZone}</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            alignItems: 'end'
          }}>
            <div className="form-group">
              <label>Kritični prag (%):</label>
              <input
                type="number"
                name="critical_moisture"
                value={thresholdData.critical_moisture}
                onChange={handleThresholdChange}
                min="0"
                max="100"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e8edf2',
                  fontSize: '14px',
                  width: '100%'
                }}
              />
            </div>
            <div className="form-group">
              <label>Upozoravajući prag (%):</label>
              <input
                type="number"
                name="warning_moisture"
                value={thresholdData.warning_moisture}
                onChange={handleThresholdChange}
                min="0"
                max="100"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e8edf2',
                  fontSize: '14px',
                  width: '100%'
                }}
              />
            </div>
            <div className="form-group">
              <label>Kanali za notifikacije:</label>
              <div style={{ display: 'flex', gap: '16px', paddingTop: '6px' }}>
                <label style={{ color: '#a0aec0', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    name="sms"
                    checked={thresholdData.notification_channels.includes('sms')}
                    onChange={handleThresholdChange}
                  /> SMS
                </label>
                <label style={{ color: '#a0aec0', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    name="email"
                    checked={thresholdData.notification_channels.includes('email')}
                    onChange={handleThresholdChange}
                  /> Email
                </label>
                <label style={{ color: '#a0aec0', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    name="push"
                    checked={thresholdData.notification_channels.includes('push')}
                    onChange={handleThresholdChange}
                  /> Push
                </label>
              </div>
            </div>
            <button onClick={handleSetThreshold} className="btn-create">
              <i className="fas fa-save"></i> Sačuvaj prag
            </button>
          </div>
        </div>
      )}

      {/* ===== LISTA ALERTA ===== */}
      {loading ? (
        <p>Učitavanje...</p>
      ) : alerts.length === 0 ? (
        <p>✅ Nema alerta za prikaz za zonu {selectedZone}.</p>
      ) : (
        <ul className="alerts-list">
          {alerts.map((alert) => (
            <li key={alert.alert_id} className={`alert-item ${alert.type.toLowerCase()}`}>
              <div className="alert-info">
                <span className="alert-type">
                  {alert.type === 'CRITICAL' ? '🚨' : alert.type === 'WARNING' ? '⚠️' : 'ℹ️'}
                  {' '}{alert.type}
                </span>
                <span className="alert-message">{alert.message}</span>
                <span className="alert-details">
                  Zona: {alert.zone_id} | Vlažnost: {alert.moisture_value}% | Prag: {alert.threshold_value}%
                </span>
                <span className="alert-time">
                  Vreme: {new Date(alert.created_at).toLocaleString()}
                </span>
                <span className={`alert-status ${alert.is_resolved ? 'resolved' : 'unresolved'}`}>
                  {alert.is_resolved ? '✅ Resolvovan' : '⏳ Aktivan'}
                </span>
              </div>
              {!alert.is_resolved && (
                <button onClick={() => handleResolve(alert.alert_id)} className="btn-resolve">
                  ✅ Resolvuj
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Alerts;