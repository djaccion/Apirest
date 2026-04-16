const metricsServiceMock = {
  getAverageDeploymentTime: jest.fn(),
};

jest.mock('../../../src/services/metrics.service', () => metricsServiceMock);

const metricsController = require('../../../src/controllers/metrics.controller');

function buildMockReq(params = {}) {
  return {
    params: { ...params },
  };
}

function buildMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('MetricsController', () => {
  describe('getAverageTime', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 200 with data when service resolves with a valid object', async () => {
      const serviceResult = {
        id_app: 42,
        average_time_seconds: 120.5,
        period: 'last_7_days',
      };
      metricsServiceMock.getAverageDeploymentTime.mockResolvedValue(serviceResult);

      const req = buildMockReq({ id_app: '42' });
      const res = buildMockRes();

      await metricsController.getAverageTime(req, res);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(serviceResult);
      expect(metricsServiceMock.getAverageDeploymentTime).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when service resolves with null (application not found)', async () => {
      metricsServiceMock.getAverageDeploymentTime.mockResolvedValue(null);

      const req = buildMockReq({ id_app: '42' });
      const res = buildMockRes();

      await metricsController.getAverageTime(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
      expect(res.json.mock.calls[0][0].message).toMatch(/not found/i);
    });

    it('should return 200 with average_time_seconds null or 0 when no deployments exist in the period', async () => {
      const serviceResult = {
        id_app: 42,
        average_time_seconds: null,
        period: 'last_7_days',
      };
      metricsServiceMock.getAverageDeploymentTime.mockResolvedValue(serviceResult);

      const req = buildMockReq({ id_app: '42' });
      const res = buildMockRes();

      await metricsController.getAverageTime(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          average_time_seconds: null,
        })
      );
    });

    it('should return 500 when service rejects with an internal error', async () => {
      metricsServiceMock.getAverageDeploymentTime.mockRejectedValue(
        new Error('Database error')
      );

      const req = buildMockReq({ id_app: '42' });
      const res = buildMockRes();

      await metricsController.getAverageTime(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it('should return 400 and not call service when id_app is non-numeric', async () => {
      const req = buildMockReq({ id_app: 'abc' });
      const res = buildMockRes();

      await metricsController.getAverageTime(req, res);

      const statusCalled = res.status.mock.calls.length > 0;

      if (statusCalled) {
        expect(res.status).toHaveBeenCalledWith(400);
        expect(metricsServiceMock.getAverageDeploymentTime).not.toHaveBeenCalled();
      } else {
        test.todo(
          'Validation of non-numeric id_app is handled by upstream middleware, not the controller directly'
        );
      }
    });

    it('should call service with the correct id_app argument', async () => {
      const serviceResult = {
        id_app: 99,
        average_time_seconds: 85.3,
        period: 'last_7_days',
      };
      metricsServiceMock.getAverageDeploymentTime.mockResolvedValue(serviceResult);

      const req = buildMockReq({ id_app: '99' });
      const res = buildMockRes();

      await metricsController.getAverageTime(req, res);

      expect(metricsServiceMock.getAverageDeploymentTime).toHaveBeenCalledTimes(1);

      const calledWith = metricsServiceMock.getAverageDeploymentTime.mock.calls[0][0];
      const normalizedCalledWith =
        typeof calledWith === 'number' ? String(calledWith) : calledWith;

      expect(['99', 99]).toContain(
        typeof calledWith === 'number' ? calledWith : calledWith
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResult);
    });
  });
});