const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Kafka } = require('kafkajs');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// Kafka konfiguracija
const kafka = new Kafka({
  clientId: 'processor-service',
  brokers: ['kafka:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'processor-group' });

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'processor-service',
    timestamp: new Date().toISOString()
  });
});

// Inicijalizacija
async function init() {
  try {
    // Poveži producer
    await producer.connect();
    console.log('✅ Processor: Producer povezan');
    
    // Poveži consumer
    await consumer.connect();
    console.log('✅ Processor: Consumer povezan');
    
    // Subscribe na topic
    await consumer.subscribe({ topic: 'sensor-data', fromBeginning: true });
    console.log('✅ Processor: Subscribovan na "sensor-data"');
    
    // Pokreni consumer
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`📥 Processor: Primljena poruka sa "sensor-data"`);
          console.log(`   zone_id: ${data.zone_id}, moisture: ${data.moisture}`);
          
          // POSLOVNA LOGIKA: Ako je vlažnost ispod 40%, pošalji upozorenje
          if (data.moisture < 40) {
            console.log(`⚠️ Processor: Vlažnost ${data.moisture}% je ispod 40%`);
            
            // Pošalji poruku na drugi topic
            const alertMessage = {
              zone_id: data.zone_id,
              moisture: data.moisture,
              message: `UPOZORENJE: Vlažnost ${data.moisture}% je ispod 40%`,
              timestamp: new Date().toISOString()
            };
            
            await producer.send({
              topic: 'alerts',
              messages: [
                {
                  key: data.zone_id,
                  value: JSON.stringify(alertMessage),
                  timestamp: Date.now().toString()
                }
              ]
            });
            console.log(`📨 Processor: Poslata poruka na "alerts"`);
          } else {
            console.log(`✅ Processor: Vlažnost ${data.moisture}% je u redu`);
          }
        } catch (error) {
          console.error('❌ Processor: Greška pri obradi poruke:', error);
        }
      }
    });
    
    console.log('✅ Processor: Consumer pokrenut');
  } catch (error) {
    console.error('❌ Processor: Greška pri inicijalizaciji:', error);
  }
}

// Pokreni server
app.listen(PORT, () => {
  console.log(`🚀 Processor Service pokrenut na portu ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/processor`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

// Pokreni Kafka
init();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gašenje Processor Service...');
  await producer.disconnect();
  await consumer.disconnect();
  process.exit(0);
});