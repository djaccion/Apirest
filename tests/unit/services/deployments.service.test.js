const DeploymentsRepository = require('../../../src/repositories/deployments.repository');
const EventPublisher = require('../../../src/events/event.publisher');
const cacheClient = require('../../../src/cache/redis.client');
const DeploymentsService = require('../../../src/services/deployments.service');

jest.mock('../../../src/repositories/deployments.repository');
jest.mock('../../../src/events/event.publisher');
jest.mock('../../../src/cache/redis.client', () => ({
  del: jest.fn(),
}));

describe('DeploymentsService', () => {
  let deploymentsService;
  let mockRepository;
  let mockEventPublisher;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
      findSuccessfulByAppIdInLastDays: jest.fn(),
      findAll: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn(),
    };

    DeploymentsRepository.mockImplementation(() => mockRepository);
    EventPublisher.mockImplementation(() => mockEventPublisher);

    deploymentsService = new DeploymentsService(
      new DeploymentsRepository(),
      new EventPublisher(),
      cacheClient
    );
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('registerDeployment', () => {
    it('should create a deployment, publish an event and return the created deployment on valid payload', async () => {
      // Arrange
      const payload = {
        id_app: 'app-123',
        status: 'SUCCESS',
        duration: 150,
        timestamp: new Date().toISOString(),
      };
      const createdDeployment = { id: 1, ...payload };
      mockRepository.create.mockResolvedValue(createdDeployment);
      mockEventPublisher.publish.mockResolvedValue(true);

      // Act
      const result = await deploymentsService.registerDeployment(payload);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_app: payload.id_app,
          status: payload.status,
          duration: payload.duration,
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'deployment.created',
        expect.objectContaining({ id_app: payload.id_app })
      );
      expect(result).toEqual(createdDeployment);
    });

    it('should throw a validation error and NOT call repository when status is invalid', async () => {
      // Arrange
      const payload = {
        id_app: 'app-123',
        status: 'INVALID_STATUS',
        duration: 150,
        timestamp: new Date().toISOString(),
      };

      // Act & Assert
      await expect(deploymentsService.registerDeployment(payload)).rejects.toThrow();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should throw a validation error with descriptive message when status is not one of allowed values', async () => {
      // Arrange
      const payload = {
        id_app: 'app-123',
        status: 'UNKNOWN',
        duration: 150,
        timestamp: new Date().toISOString(),
      };

      // Act & Assert
      await expect(deploymentsService.registerDeployment(payload)).rejects.toThrow(
        /status/i
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate repository error and NOT publish event when repository throws', async () => {
      // Arrange
      const payload = {
        id_app: 'app-123',
        status: 'FAILED',
        duration: 200,
        timestamp: new Date().toISOString(),
      };
      const repositoryError = new Error('Database connection error');
      mockRepository.create.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(deploymentsService.registerDeployment(payload)).rejects.toThrow(
        'Database connection error'
      );
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should throw error when RabbitMQ publish fails after successful repository creation', async () => {
      // Arrange
      const payload = {
        id_app: 'app-123',
        status: 'SUCCESS',
        duration: 100,
        timestamp: new Date().toISOString(),
      };
      const createdDeployment = { id: 2, ...payload };
      mockRepository.create.mockResolvedValue(createdDeployment);
      mockEventPublisher.publish.mockRejectedValue(new Error('RabbitMQ unavailable'));

      // Act & Assert
      await expect(deploymentsService.registerDeployment(payload)).rejects.toThrow(
        'RabbitMQ unavailable'
      );
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    it('should throw validation error when id_app is missing', async () => {
      // Arrange
      const payload = {
        status: 'SUCCESS',
        duration: 100,
        timestamp: new Date().toISOString(),
      };

      // Act & Assert
      await expect(deploymentsService.registerDeployment(payload)).rejects.toThrow();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should throw validation error when status is missing', async () => {
      // Arrange
      const payload = {
        id_app: 'app-123',
        duration: 100,
        timestamp: new Date().toISOString(),
      };

      // Act & Assert
      await expect(deploymentsService.registerDeployment(payload)).rejects.toThrow();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should throw validation error when both id_app and status are missing', async () => {
      // Arrange
      const payload = {
        duration: 100,
        timestamp: new Date().toISOString(),
      };

      // Act & Assert
      await expect(deploymentsService.registerDeployment(payload)).rejects.toThrow();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should accept IN_PROGRESS as a valid status', async () => {
      // Arrange
      const payload = {
        id_app: 'app-456',
        status: 'IN_PROGRESS',
        duration: 0,
        timestamp: new Date().toISOString(),
      };
      const createdDeployment = { id: 3, ...payload };
      mockRepository.create.mockResolvedValue(createdDeployment);
      mockEventPublisher.publish.mockResolvedValue(true);

      // Act
      const result = await deploymentsService.registerDeployment(payload);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdDeployment);
    });

    it('should accept FAILED as a valid status', async () => {
      // Arrange
      const payload = {
        id_app: 'app-789',
        status: 'FAILED',
        duration: 50,
        timestamp: new Date().toISOString(),
      };
      const createdDeployment = { id: 4, ...payload };
      mockRepository.create.mockResolvedValue(createdDeployment);
      mockEventPublisher.publish.mockResolvedValue(true);

      // Act
      const result = await deploymentsService.registerDeployment(payload);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdDeployment);
    });
  });

  describe('getAverageDeploymentTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should calculate the correct average duration for successful deployments', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'app-123';
      const deployments = [
        { id: 1, id_app: idApp, status: 'SUCCESS', duration: 100 },
        { id: 2, id_app: idApp, status: 'SUCCESS', duration: 200 },
        { id: 3, id_app: idApp, status: 'SUCCESS', duration: 300 },
      ];
      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue(deployments);

      // Act
      const result = await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(result).toBe(200);
      expect(mockRepository.findSuccessfulByAppIdInLastDays).toHaveBeenCalledTimes(1);
    });

    it('should return 0 or null when no deployments exist in the period without throwing division by zero', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'app-empty';
      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue([]);

      // Act
      const result = await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(result === 0 || result === null).toBe(true);
      expect(mockRepository.findSuccessfulByAppIdInLastDays).toHaveBeenCalledTimes(1);
    });

    it('should exclude FAILED deployments from average calculation when filtering is done in service', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'app-mixed';
      const deployments = [
        { id: 1, id_app: idApp, status: 'SUCCESS', duration: 100 },
        { id: 2, id_app: idApp, status: 'FAILED', duration: 999 },
        { id: 3, id_app: idApp, status: 'SUCCESS', duration: 300 },
      ];
      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue(
        deployments.filter((d) => d.status === 'SUCCESS')
      );

      // Act
      const result = await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(result).toBe(200);
    });

    it('should return 0 or null for a non-existent id_app without throwing an error', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'non-existent-app';
      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue([]);

      // Act
      const result = await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(result === 0 || result === null).toBe(true);
    });

    it('should call repository with date range corresponding to exactly the last 7 days', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'app-date-check';
      const expectedEndDate = new Date('2024-06-15T12:00:00.000Z');
      const expectedStartDate = new Date('2024-06-08T12:00:00.000Z');

      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue([]);

      // Act
      await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(mockRepository.findSuccessfulByAppIdInLastDays).toHaveBeenCalledWith(
        idApp,
        expect.any(Date),
        expect.any(Date)
      );

      const callArgs = mockRepository.findSuccessfulByAppIdInLastDays.mock.calls[0];
      const startDateArg = callArgs[1];
      const endDateArg = callArgs[2];

      expect(startDateArg.getTime()).toBe(expectedStartDate.getTime());
      expect(endDateArg.getTime()).toBe(expectedEndDate.getTime());
    });

    it('should return the duration itself when there is only one deployment', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'app-single';
      const deployments = [
        { id: 1, id_app: idApp, status: 'SUCCESS', duration: 450 },
      ];
      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue(deployments);

      // Act
      const result = await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(result).toBe(450);
    });

    it('should call repository with the correct id_app parameter', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'specific-app-id';
      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue([]);

      // Act
      await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(mockRepository.findSuccessfulByAppIdInLastDays).toHaveBeenCalledWith(
        'specific-app-id',
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should handle deployments with duration 0 correctly in average calculation', async () => {
      // Arrange
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      jest.setSystemTime(fixedDate);

      const idApp = 'app-zero-duration';
      const deployments = [
        { id: 1, id_app: idApp, status: 'SUCCESS', duration: 0 },
        { id: 2, id_app: idApp, status: 'SUCCESS', duration: 0 },
        { id: 3, id_app: idApp, status: 'SUCCESS', duration: 300 },
      ];
      mockRepository.findSuccessfulByAppIdInLastDays.mockResolvedValue(deployments);

      // Act
      const result = await deploymentsService.getAverageDeploymentTime(idApp);

      // Assert
      expect(result).toBe(100);
    });
  });

  describe('listDeployments', () => {
    it('should return a paginated list of deployments from the repository', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const paginatedResult = {
        data: [
          { id: 1, id_app: 'app-1', status: 'SUCCESS', duration: 100 },
          { id: 2, id_app: 'app-2', status: 'FAILED', duration: 50 },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockRepository.findAll.mockResolvedValue(paginatedResult);

      // Act
      const result = await deploymentsService.listDeployments({ page, limit });

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass page and limit parameters correctly to the repository', async () => {
      // Arrange
      const page = 3;
      const limit = 25;
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 3,
        limit: 25,
      });

      // Act
      await deploymentsService.listDeployments({ page, limit });

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3, limit: 25 })
      );
    });

    it('should use default pagination values when page and limit are not provided', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      // Act
      await deploymentsService.listDeployments({});

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      const callArgs = mockRepository.findAll.mock.calls[0][0];
      expect(callArgs).toHaveProperty('page');
      expect(callArgs).toHaveProperty('limit');
    });

    it('should propagate repository error when findAll throws', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      mockRepository.findAll.mockRejectedValue(new Error('DB error on findAll'));

      // Act & Assert
      await expect(deploymentsService.listDeployments({ page, limit })).rejects.toThrow(
        'DB error on findAll'
      );
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty data array when no deployments exist', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      // Act
      const result = await deploymentsService.listDeployments({ page, limit });

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});