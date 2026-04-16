const deploymentsController = require('../../../src/controllers/deployments.controller');
const deploymentsService = require('../../../src/services/deployments.service');

jest.mock('../../../src/services/deployments.service');

const buildMockReq = ({ body = {}, params = {}, query = {}, user = { id: 1, role: 'admin' } } = {}) => ({
  body,
  params,
  query,
  user,
});

const buildMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('DeploymentsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {});

  // ─────────────────────────────────────────────────────────────────────────────
  // registerDeployment
  // ─────────────────────────────────────────────────────────────────────────────
  describe('registerDeployment', () => {
    const validPayload = {
      id_app: 'app-frontend',
      version: '1.0.0',
      environment: 'production',
      status: 'SUCCESS',
      deployed_by: 'user-deploy-01',
    };

    const createdDeployment = {
      id: 42,
      ...validPayload,
      created_at: '2024-01-15T10:00:00.000Z',
    };

    it('should return 201 with created deployment when valid payload is provided', async () => {
      deploymentsService.registerDeployment.mockResolvedValue(createdDeployment);

      const req = buildMockReq({ body: validPayload });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 42,
            id_app: 'app-frontend',
            version: '1.0.0',
            environment: 'production',
            status: 'SUCCESS',
            deployed_by: 'user-deploy-01',
            created_at: '2024-01-15T10:00:00.000Z',
          }),
        })
      );
    });

    it('should return 404 with descriptive message when service throws application not found error', async () => {
      const notFoundError = new Error('Application not found');
      notFoundError.name = 'NotFoundError';
      deploymentsService.registerDeployment.mockRejectedValue(notFoundError);

      const req = buildMockReq({ body: validPayload });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
      const calledStatus = res.status.mock.calls[0][0];
      expect([404, 422]).toContain(calledStatus);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error).toBeTruthy();
    });

    it('should return 500 with generic message when service throws unexpected internal error', async () => {
      const internalError = new Error('Unexpected database failure');
      deploymentsService.registerDeployment.mockRejectedValue(internalError);

      const req = buildMockReq({ body: validPayload });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error).not.toContain('database failure');
      expect(jsonArg).not.toHaveProperty('stack');
    });

    it('should delegate to service exactly once with correct arguments when valid payload is provided', async () => {
      deploymentsService.registerDeployment.mockResolvedValue(createdDeployment);

      const req = buildMockReq({ body: validPayload });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(deploymentsService.registerDeployment).toHaveBeenCalledTimes(1);
      expect(deploymentsService.registerDeployment).toHaveBeenCalledWith(
        expect.objectContaining({
          id_app: validPayload.id_app,
          version: validPayload.version,
          environment: validPayload.environment,
          status: validPayload.status,
          deployed_by: validPayload.deployed_by,
        })
      );
    });

    it('should return 201 with created deployment when deployed_by is an integer', async () => {
      const payloadWithIntDeployedBy = { ...validPayload, deployed_by: 7 };
      const createdWithInt = { ...createdDeployment, deployed_by: 7 };
      deploymentsService.registerDeployment.mockResolvedValue(createdWithInt);

      const req = buildMockReq({ body: payloadWithIntDeployedBy });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deployed_by: 7 }),
        })
      );
    });

    it('should return 201 with created deployment when environment is staging', async () => {
      const stagingPayload = { ...validPayload, environment: 'staging' };
      const stagingDeployment = { ...createdDeployment, environment: 'staging' };
      deploymentsService.registerDeployment.mockResolvedValue(stagingDeployment);

      const req = buildMockReq({ body: stagingPayload });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ environment: 'staging' }),
        })
      );
    });

    it('should return 201 with created deployment when status is FAILED', async () => {
      const failedPayload = { ...validPayload, status: 'FAILED' };
      const failedDeployment = { ...createdDeployment, status: 'FAILED' };
      deploymentsService.registerDeployment.mockResolvedValue(failedDeployment);

      const req = buildMockReq({ body: failedPayload });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        })
      );
    });

    it('should return 201 with created deployment when status is IN_PROGRESS', async () => {
      const inProgressPayload = { ...validPayload, status: 'IN_PROGRESS' };
      const inProgressDeployment = { ...createdDeployment, status: 'IN_PROGRESS' };
      deploymentsService.registerDeployment.mockResolvedValue(inProgressDeployment);

      const req = buildMockReq({ body: inProgressPayload });
      const res = buildMockRes();

      await deploymentsController.registerDeployment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getDeploymentById
  // ─────────────────────────────────────────────────────────────────────────────
  describe('getDeploymentById', () => {
    const deploymentRecord = {
      id: 10,
      id_app: 'app-backend',
      version: '2.3.1',
      environment: 'production',
      status: 'SUCCESS',
      deployed_by: 'ci-runner',
      created_at: '2024-01-10T08:30:00.000Z',
    };

    it('should return 200 with deployment data when valid id is provided', async () => {
      deploymentsService.getDeploymentById.mockResolvedValue(deploymentRecord);

      const req = buildMockReq({ params: { id: '10' } });
      const res = buildMockRes();

      await deploymentsController.getDeploymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 10,
            id_app: 'app-backend',
          }),
        })
      );
    });

    it('should return 404 with appropriate message when deployment is not found by id', async () => {
      deploymentsService.getDeploymentById.mockResolvedValue(null);

      const req = buildMockReq({ params: { id: '9999' } });
      const res = buildMockRes();

      await deploymentsController.getDeploymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should return 404 when service throws NotFound error for given id', async () => {
      const notFoundError = new Error('Deployment not found');
      notFoundError.name = 'NotFoundError';
      deploymentsService.getDeploymentById.mockRejectedValue(notFoundError);

      const req = buildMockReq({ params: { id: '9999' } });
      const res = buildMockRes();

      await deploymentsController.getDeploymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should return 500 when service throws unexpected error while fetching deployment by id', async () => {
      deploymentsService.getDeploymentById.mockRejectedValue(new Error('DB connection lost'));

      const req = buildMockReq({ params: { id: '10' } });
      const res = buildMockRes();

      await deploymentsController.getDeploymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should call service exactly once with correct id when valid id param is provided', async () => {
      deploymentsService.getDeploymentById.mockResolvedValue(deploymentRecord);

      const req = buildMockReq({ params: { id: '10' } });
      const res = buildMockRes();

      await deploymentsController.getDeploymentById(req, res);

      expect(deploymentsService.getDeploymentById).toHaveBeenCalledTimes(1);
      expect(deploymentsService.getDeploymentById).toHaveBeenCalledWith('10');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getAverageDeploymentTime
  // ─────────────────────────────────────────────────────────────────────────────
  describe('getAverageDeploymentTime', () => {
    const metricsResult = {
      id_app: 'app-frontend',
      average_time: 125.5,
      unit: 'seconds',
      period: 'last_7_days',
      total_deployments: 8,
    };

    it('should return 200 with average time data when valid id_app is provided', async () => {
      deploymentsService.getAverageDeploymentTime.mockResolvedValue(metricsResult);

      const req = buildMockReq({ params: { id_app: 'app-frontend' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id_app: 'app-frontend',
            average_time: 125.5,
            period: 'last_7_days',
          }),
        })
      );
    });

    it('should return 200 with no-data indicator when service resolves with null for id_app', async () => {
      deploymentsService.getAverageDeploymentTime.mockResolvedValue(null);

      const req = buildMockReq({ params: { id_app: 'app-frontend' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = res.json.mock.calls[0][0];
      const hasNoDataIndicator =
        jsonArg.data === null ||
        jsonArg.message !== undefined ||
        (jsonArg.data && (jsonArg.data.average_time === 0 || jsonArg.data.average_time === null));
      expect(hasNoDataIndicator).toBe(true);
    });

    it('should return 200 with zero average time indicator when service resolves with average_time zero', async () => {
      const emptyMetrics = {
        id_app: 'app-frontend',
        average_time: 0,
        unit: 'seconds',
        period: 'last_7_days',
        total_deployments: 0,
      };
      deploymentsService.getAverageDeploymentTime.mockResolvedValue(emptyMetrics);

      const req = buildMockReq({ params: { id_app: 'app-frontend' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            average_time: 0,
            total_deployments: 0,
          }),
        })
      );
    });

    it('should return 200 with no deployments message when service resolves with empty deployments object', async () => {
      const noDeploymentsResult = {
        id_app: 'app-new',
        average_time: null,
        period: 'last_7_days',
        total_deployments: 0,
        message: 'No deployments found in the specified period',
      };
      deploymentsService.getAverageDeploymentTime.mockResolvedValue(noDeploymentsResult);

      const req = buildMockReq({ params: { id_app: 'app-new' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 when service throws application not found error for id_app', async () => {
      const notFoundError = new Error('Application not found');
      notFoundError.name = 'NotFoundError';
      deploymentsService.getAverageDeploymentTime.mockRejectedValue(notFoundError);

      const req = buildMockReq({ params: { id_app: 'nonexistent-app' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should return 500 when service throws unexpected error while calculating average time', async () => {
      deploymentsService.getAverageDeploymentTime.mockRejectedValue(new Error('Redis timeout'));

      const req = buildMockReq({ params: { id_app: 'app-frontend' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.error).not.toContain('Redis timeout');
      expect(jsonArg).not.toHaveProperty('stack');
    });

    it('should call service exactly once with correct id_app when valid param is provided', async () => {
      deploymentsService.getAverageDeploymentTime.mockResolvedValue(metricsResult);

      const req = buildMockReq({ params: { id_app: 'app-frontend' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(deploymentsService.getAverageDeploymentTime).toHaveBeenCalledTimes(1);
      expect(deploymentsService.getAverageDeploymentTime).toHaveBeenCalledWith('app-frontend');
    });

    it('should return 200 with average time in seconds when service resolves with valid metrics for last 7 days', async () => {
      const detailedMetrics = {
        id_app: 'app-payments',
        average_time: 300,
        unit: 'seconds',
        period: 'last_7_days',
        from: '2024-01-08T00:00:00.000Z',
        to: '2024-01-15T00:00:00.000Z',
        total_deployments: 5,
      };
      deploymentsService.getAverageDeploymentTime.mockResolvedValue(detailedMetrics);

      const req = buildMockReq({ params: { id_app: 'app-payments' } });
      const res = buildMockRes();

      await deploymentsController.getAverageDeploymentTime(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            average_time: 300,
            period: 'last_7_days',
          }),
        })
      );
    });
  });
});