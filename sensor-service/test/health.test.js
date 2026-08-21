const request = require('supertest');
const app = require('../src/index'); // Pretpostavka da index.js exportuje app

describe('Sensor Service Health Check', () => {
  it('should return 200 OK for /health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'sensor-service');
  });
});