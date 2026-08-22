const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'irrigation-service',
  brokers: ['kafka:9092'] // Kada se pokrene u Docker-u
});

const consumer = kafka.consumer({ groupId: 'irrigation-group' });

// Inicijalizacija consumer-a
async function initializeConsumer() {
  try {
    await consumer.connect();
    console.log('✅ Kafka Consumer povezan');
    
    // Subscribe na topic
    await consumer.subscribe({ topic: 'sensor-data', fromBeginning: true });
    console.log('✅ Kafka Consumer subscribovan na topic "sensor-data"');
  } catch (error) {
    console.error('❌ Greška pri povezivanju Kafka Consumer-a:', error);
  }
}

// Pokretanje consumer-a
async function startConsumer(checkRulesCallback) {
  try {
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`📥 Kafka: Primljena poruka sa topic-a "${topic}"`);
          console.log(`   zone_id: ${data.zone_id}, moisture: ${data.moisture}`);
          
          // Pozovi callback funkciju (checkRules)
          if (checkRulesCallback) {
            await checkRulesCallback(data);
          }
        } catch (error) {
          console.error('❌ Kafka: Greška pri obradi poruke:', error);
        }
      }
    });
  } catch (error) {
    console.error('❌ Kafka: Greška pri pokretanju consumer-a:', error);
  }
}

module.exports = {
  initializeConsumer,
  startConsumer
};