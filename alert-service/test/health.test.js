const request = require('supertest');
const app = require('../src/index');

describe('Alert Service Health Check', () => {

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
    expect(response.body).toHaveProperty('service', 'alert-service');
  });
});