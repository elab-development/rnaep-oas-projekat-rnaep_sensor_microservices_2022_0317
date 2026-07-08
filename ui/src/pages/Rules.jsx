import React, { useState, useEffect } from 'react';
import { getRules, createRule, deleteRule, manualIrrigationOn, manualIrrigationOff, getZones } from '../services/api';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    zone_id: '', // <-- PRAZNO, KORISNIK BIRA
    name: '',
    moisture_threshold: 30,
    irrigation_duration_min: 10,
  });
  const [message, setMessage] = useState('');

  // ===== DOHVATANJE PODATAKA =====
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Dohvati pravila
      const rulesData = await getRules();
      setRules(rulesData);
      
      // Dohvati zone (za dropdown)
      const zonesData = await getZones();
      setZones(zonesData);
      
      // Ako ima zona, postavi prvu kao default
      if (zonesData.length > 0 && !newRule.zone_id) {
        setNewRule(prev => ({ ...prev, zone_id: zonesData[0].zone_id }));
      }
    } catch (error) {
      console.error('Greška pri dohvatanju podataka:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== KREIRANJE PRAVILA =====
  const handleCreateRule = async (e) => {
    e.preventDefault();
    
    // Validacija
    if (!newRule.zone_id) {
      setMessage('❌ Morate odabrati zonu!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await createRule(newRule);
      setMessage('✅ Pravilo uspešno kreirano!');
      setNewRule({ 
        zone_id: zones[0]?.zone_id || '', 
        name: '', 
        moisture_threshold: 30, 
        irrigation_duration_min: 10 
      });
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Greška pri kreiranju pravila.');
      console.error(error);
    }
  };

  // ===== BRISANJE PRAVILA =====
  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovo pravilo?')) {
      try {
        await deleteRule(ruleId);
        setMessage('✅ Pravilo obrisano!');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('❌ Greška pri brisanju pravila.');
        console.error(error);
      }
    }
  };

  // ===== RUČNO UPRAVLJANJE =====
  const handleManualOn = async () => {
    // Ako nema izabrane zone, koristi prvu
    const zoneId = newRule.zone_id || zones[0]?.zone_id || 'ZONE_1';
    try {
      await manualIrrigationOn(zoneId, 10);
      setMessage(`✅ Zalivanje ručno uključeno za zonu ${zoneId} na 10 minuta!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Greška pri uključivanju zalivanja.');
      console.error(error);
    }
  };

  const handleManualOff = async () => {
    const zoneId = newRule.zone_id || zones[0]?.zone_id || 'ZONE_1';
    try {
      await manualIrrigationOff(zoneId);
      setMessage(`⛔ Zalivanje ručno isključeno za zonu ${zoneId}!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Greška pri isključivanju zalivanja.');
      console.error(error);
    }
  };

  // ===== PROMENA INPUTA =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRule(prev => ({
      ...prev,
      [name]: name === 'moisture_threshold' || name === 'irrigation_duration_min' 
        ? parseFloat(value) 
        : value
    }));
  };

  return (
    <div className="rules">
      <h1>⚙️ Pravila zalivanja</h1>

      {message && <div className="message">{message}</div>}

      {/* ===== RUČNO UPRAVLJANJE ===== */}
      <div className="manual-control">
        <h3>🖐️ Ručno upravljanje</h3>
        <div className="zone-selector" style={{ marginBottom: '10px' }}>
          <label>Odaberi zonu za ručno upravljanje: </label>
          <select
            value={newRule.zone_id}
            onChange={(e) => setNewRule(prev => ({ ...prev, zone_id: e.target.value }))}
          >
            {zones.map((zone) => (
              <option key={zone.zone_id} value={zone.zone_id}>
                {zone.name || zone.zone_id} ({zone.zone_id})
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleManualOn} className="btn-on">
          <i className="fas fa-play"></i> Uključi zalivanje
        </button>
        <button onClick={handleManualOff} className="btn-off">
          <i className="fas fa-stop"></i> Isključi zalivanje
        </button>
      </div>

      {/* ===== KREIRANJE NOVOG PRAVILA ===== */}
      <div className="create-rule">
        <h3>➕ Kreiraj novo pravilo</h3>
        <form onSubmit={handleCreateRule}>
          {/* Odabir zone */}
          <div className="form-group">
            <label><i className="fas fa-map-marker-alt"></i> Zona:</label>
            <select
              name="zone_id"
              value={newRule.zone_id}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Odaberi zonu --</option>
              {zones.map((zone) => (
                <option key={zone.zone_id} value={zone.zone_id}>
                  {zone.name || zone.zone_id} ({zone.zone_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Naziv pravila:</label>
            <input
              type="text"
              name="name"
              value={newRule.name}
              onChange={handleInputChange}
              required
              placeholder="npr. Auto zalivanje"
            />
          </div>
          
          <div className="form-group">
            <label>Prag vlažnosti (%):</label>
            <input
              type="number"
              name="moisture_threshold"
              value={newRule.moisture_threshold}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
            />
          </div>
          
          <div className="form-group">
            <label>Trajanje zalivanja (min):</label>
            <input
              type="number"
              name="irrigation_duration_min"
              value={newRule.irrigation_duration_min}
              onChange={handleInputChange}
              required
              min="1"
            />
          </div>
          
          <button type="submit" className="btn-create">
            <i className="fas fa-plus"></i> Kreiraj pravilo
          </button>
        </form>
      </div>

      {/* ===== LISTA PRAVILA ===== */}
      <div className="rules-list">
        <h3>📋 Postojeća pravila</h3>
        {loading ? (
          <p>Učitavanje...</p>
        ) : rules.length === 0 ? (
          <p>Nema kreiranih pravila.</p>
        ) : (
          <ul>
            {rules.map((rule) => {
              // Pronađi naziv zone za prikaz
              const zone = zones.find(z => z.zone_id === rule.zone_id);
              const zoneName = zone ? zone.name : rule.zone_id;
              
              return (
                <li key={rule.rule_id} className="rule-item">
                  <div className="rule-info">
                    <span className="rule-name">
                      {rule.name}
                    </span>
                    <span className="rule-details">
                      📍 Zona: {zoneName} ({rule.zone_id}) | 
                      🔽 Prag: {rule.moisture_threshold}% | 
                      ⏱️ Trajanje: {rule.irrigation_duration_min} min
                    </span>
                    <span className={`rule-status ${rule.is_active ? 'active' : 'inactive'}`}>
                      {rule.is_active ? '✅ Aktivan' : '❌ Neaktivan'}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteRule(rule.rule_id)} className="btn-delete">
                    <i className="fas fa-trash"></i> Obriši
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Rules;