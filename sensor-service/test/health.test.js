// Bez KAFKE
if (process.env.CI) {
  jest.mock('kafkajs', () => {
    return {
      Kafka: jest.fn().mockImplementation(() => ({
        producer: jest.fn().mockReturnValue({
          connect: jest.fn().mockResolvedValue(),
          send: jest.fn().mockResolvedValue(),
          disconnect: jest.fn().mockResolvedValue()
        }),
        consumer: jest.fn().mockReturnValue({
          connect: jest.fn().mockResolvedValue(),
          subscribe: jest.fn().mockResolvedValue(),
          run: jest.fn().mockResolvedValue(),
          disconnect: jest.fn().mockResolvedValue()
        })
      }))
    };
  });
}

const request = require('supertest');
const app = require('../src/index');

describe('Sensor Service Health Check', () => {
  afterAll(async () => {
    // Zatvori sve otvorene konekcije
    if (app.close) {
      await new Promise(resolve => app.close(resolve));
    }
  });

  it('should return 200 OK for /health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'sensor-service');
  });
});