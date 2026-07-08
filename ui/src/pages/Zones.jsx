import React, { useState, useEffect } from 'react';
import { getZones, createZone, deleteZone } from '../services/api';

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newZone, setNewZone] = useState({
    zone_id: '',
    parcel_id: '',
    name: '',
    sensor_id: 'SENSOR_01',
    valve_id: 'VALVE_01',
    latitude: 44.7866,
    longitude: 20.4489,
    city: 'Belgrade'
  });

  // ===== DOHVATANJE ZONA =====
  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await getZones();
      setZones(data);
    } catch (error) {
      console.error('Greška pri dohvatanju zona:', error);
      setMessage('❌ Greška pri dohvatanju zona.');
    } finally {
      setLoading(false);
    }
  };

  // ===== KREIRANJE ZONE =====
  const handleCreateZone = async (e) => {
    e.preventDefault();
    
    // Validacija
    if (!newZone.zone_id || !newZone.name) {
      setMessage('❌ Zone ID i Naziv su obavezni!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await createZone(newZone);
      setMessage(`✅ Zona "${newZone.name}" uspešno kreirana!`);
      setNewZone({
        zone_id: '',
        parcel_id: '',
        name: '',
        sensor_id: 'SENSOR_01',
        valve_id: 'VALVE_01',
        latitude: 44.7866,
        longitude: 20.4489,
        city: 'Belgrade'
      });
      fetchZones();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Greška pri kreiranju zone:', error);
      setMessage('❌ Greška pri kreiranju zone.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // ===== BRISANJE ZONE =====
  const handleDeleteZone = async (zoneId) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete zonu "${zoneId}"?`)) {
      try {
        await deleteZone(zoneId);
        setMessage(`✅ Zona "${zoneId}" obrisana!`);
        fetchZones();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Greška pri brisanju zone:', error);
        setMessage('❌ Greška pri brisanju zone.');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  // ===== PROMENA INPUTA =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewZone(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' 
        ? parseFloat(value) 
        : value
    }));
  };

  return (
    <div className="zones">
      <h1><i className="fas fa-map-marked-alt"></i> Upravljanje zonama</h1>

      {message && <div className="message">{message}</div>}

      {/* ===== FORMA ZA KREIRANJE ZONE ===== */}
      <div className="create-zone">
        <h3>➕ Kreiraj novu zonu</h3>
        <form onSubmit={handleCreateZone}>
          <div className="form-group">
            <label>ID zone:</label>
            <input
              type="text"
              name="zone_id"
              value={newZone.zone_id}
              onChange={handleInputChange}
              placeholder="npr. ZONE_1"
              required
            />
          </div>
          <div className="form-group">
            <label>Naziv zone:</label>
            <input
              type="text"
              name="name"
              value={newZone.name}
              onChange={handleInputChange}
              placeholder="npr. Njiva kod Beograda"
              required
            />
          </div>
          <div className="form-group">
            <label>Parcel ID:</label>
            <input
              type="text"
              name="parcel_id"
              value={newZone.parcel_id}
              onChange={handleInputChange}
              placeholder="npr. PARCEL_1"
            />
          </div>
          <div className="form-group">
            <label>Sensor ID:</label>
            <input
              type="text"
              name="sensor_id"
              value={newZone.sensor_id}
              onChange={handleInputChange}
              placeholder="npr. SENSOR_01"
            />
          </div>
          <div className="form-group">
            <label>Valve ID:</label>
            <input
              type="text"
              name="valve_id"
              value={newZone.valve_id}
              onChange={handleInputChange}
              placeholder="npr. VALVE_01"
            />
          </div>
          <div className="form-group">
            <label>Grad:</label>
            <input
              type="text"
              name="city"
              value={newZone.city}
              onChange={handleInputChange}
              placeholder="npr. Belgrade"
            />
          </div>
          <div className="form-group">
            <label>Geografska širina:</label>
            <input
              type="number"
              name="latitude"
              value={newZone.latitude}
              onChange={handleInputChange}
              step="0.0001"
              placeholder="npr. 44.7866"
            />
          </div>
          <div className="form-group">
            <label>Geografska dužina:</label>
            <input
              type="number"
              name="longitude"
              value={newZone.longitude}
              onChange={handleInputChange}
              step="0.0001"
              placeholder="npr. 20.4489"
            />
          </div>
          <button type="submit" className="btn-create">
            <i className="fas fa-plus"></i> Kreiraj zonu
          </button>
        </form>
      </div>

      {/* ===== LISTA ZONA ===== */}
      <div className="zones-list">
        <h3>📋 Lista zona</h3>
        {loading ? (
          <p>Učitavanje...</p>
        ) : zones.length === 0 ? (
          <p>Nema kreiranih zona.</p>
        ) : (
          <ul>
            {zones.map((zone) => (
              <li key={zone.zone_id} className="zone-item">
                <div className="zone-info">
                  <span className="zone-name">{zone.name || zone.zone_id}</span>
                  <span className="zone-details">
                    ID: {zone.zone_id} | 
                    Parcel: {zone.parcel_id || 'N/A'} | 
                    Sensor: {zone.sensor_id} | 
                    Valve: {zone.valve_id}
                  </span>
                  <span className="zone-location">
                    📍 {zone.city || 'N/A'} ({zone.latitude}, {zone.longitude})
                  </span>
                </div>
                <button onClick={() => handleDeleteZone(zone.zone_id)} className="btn-delete">
                  <i className="fas fa-trash"></i> Obriši
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Zones;