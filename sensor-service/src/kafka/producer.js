const { Kafka } = require('kafkajs');

// Konekcija na Kafka broker
const kafka = new Kafka({
  clientId: 'sensor-service',
  brokers: ['kafka:9092']  // Kada se pokrene u Docker-u
  // Ako se pokreće lokalno, koristi: brokers: ['localhost:9092']
});

const producer = kafka.producer();

// Inicijalizacija producer-a
async function initializeProducer() {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer povezan');
  } catch (error) {
    console.error('❌ Greška pri povezivanju Kafka Producer-a:', error);
  }
}

// Slanje poruke na topic
async function sendMessage(topic, message) {
  try {
    await producer.send({
      topic: topic,
      messages: [
        {
          key: message.zone_id || 'default',
          value: JSON.stringify(message),
          timestamp: Date.now().toString()
        }
      ]
    });
    console.log(`📨 Poruka poslata na topic "${topic}"`);
    return true;
  } catch (error) {
    console.error(`❌ Greška pri slanju poruke na topic "${topic}":`, error);
    return false;
  }
}

module.exports = {
  initializeProducer,
  sendMessage
};