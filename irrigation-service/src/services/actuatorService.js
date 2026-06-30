// Simulacija aktuatora (ventila)
async function simulateActuator(zone_id, duration_minutes, triggered_by = 'auto') {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  💧 AKTUATOR SIMULACIJA                             ║
╠══════════════════════════════════════════════════════╣
║  Zona ID: ${zone_id}
║  Akcija: ZALIVANJE UKLJUČENO
║  Trajanje: ${duration_minutes} minuta
║  Pokrenuto od: ${triggered_by}
║  Vreme: ${new Date().toISOString()}
╚══════════════════════════════════════════════════════╝
  `);

  // Simuliraj da se zalivanje gasi nakon duration_minutes
  setTimeout(() => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║  💧 AKTUATOR SIMULACIJA                             ║
╠══════════════════════════════════════════════════════╣
║  Zona ID: ${zone_id}
║  Akcija: ZALIVANJE ISKLJUČENO (automatski)
║  Trajanje: ${duration_minutes} minuta
║  Vreme: ${new Date().toISOString()}
╚══════════════════════════════════════════════════════╝
    `);
  }, duration_minutes * 60 * 1000);

  return { success: true };
}

module.exports = {
  simulateActuator
};