const request = require('supertest');
const app = require('../../src/app');

// Ticket Jira: XP-9
// Cubre el endpoint público de health check definido en la capa de rutas del proyecto.

describe('GET /api/v1/health - Integration Tests', () => {
  afterAll(() => {
    // No se requiere cierre explícito de recursos para este endpoint stateless.
    // Bloque incluido para mantener la estructura estándar del proyecto.
  });

  describe('Successful Responses', () => {
    it('should return 200 when no authorization header is provided', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
    });

    it('should return 200 and be accessible without Authorization header when endpoint is public', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect(response.status).toBe(200);
    });
  });

  describe('Response Body Structure', () => {
    it('should return body with status "OK" when health check is requested', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body).toHaveProperty('status', 'OK');
    });

    it('should return body with uptime as a number when health check is requested', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should return body with timestamp as a string when health check is requested', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return a valid parseable timestamp when health check is requested', async () => {
      const response = await request(app).get('/api/v1/health');
      const { timestamp } = response.body;
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should return uptime greater than or equal to zero when health check is requested', async () => {
      const response = await request(app).get('/api/v1/health');
      const { uptime } = response.body;
      expect(uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Response Headers Behavior', () => {
    it('should return Content-Type including application/json when health check is requested', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});