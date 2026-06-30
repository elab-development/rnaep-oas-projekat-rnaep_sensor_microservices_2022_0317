// Simulacija slanja notifikacije
async function sendNotification(zone_id, alert, channels) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║  📨 NOTIFIKACIJA SIMULACIJA                                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Zona ID: ${zone_id}
║  Tip: ${alert.type}
║  Poruka: ${alert.message}
║  Trenutna vlažnost: ${alert.moisture_value}%
║  Prag: ${alert.threshold_value}%
║  Kanali: ${channels.join(', ')}
║  Vreme: ${new Date().toISOString()}
╚═══════════════════════════════════════════════════════════════════════════════╝
  `);

  // Za svaki kanal, zabeleži u notification_log
  for (const channel of channels) {
    // Simuliraj slanje (uvek uspešno)
    // U stvarnom sistemu, ovde bi se pozvao Twilio/SendGrid API
  }

  return { success: true };
}

module.exports = {
  sendNotification
};