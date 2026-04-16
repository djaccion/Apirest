const metricsRepository = require('../../../src/repositories/metrics.repository');
const cacheClient = require('../../../src/cache/redis.client');

jest.mock('../../../src/repositories/metrics.repository');
jest.mock('../../../src/cache/redis.client');

const metricsService = require('../../../src/services/metrics.service');

describe('MetricsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheClient.get.mockResolvedValue(null);
    cacheClient.set.mockResolvedValue('OK');
  });

  // afterAll: El servicio de métricas no abre recursos persistentes en su inicialización,
  // por lo que no se requiere limpieza explícita aquí.

  describe('getAverageDeploymentTime - cuando hay despliegues exitosos en los últimos 7 días', () => {
    const id_app = 'app-001';

    const mockDeployments = [
      { id: 1, id_app: 'app-001', status: 'SUCCESS', duration: 100 },
      { id: 2, id_app: 'app-001', status: 'SUCCESS', duration: 200 },
      { id: 3, id_app: 'app-001', status: 'SUCCESS', duration: 300 },
    ];

    // Promedio esperado: (100 + 200 + 300) / 3 = 200
    const expectedAverage = 200;

    beforeEach(() => {
      metricsRepository.getSuccessfulDeploymentsByAppAndDateRange.mockResolvedValue(mockDeployments);
    });

    it('Caso 1: debe retornar el tiempo promedio calculado correctamente', async () => {
      const result = await metricsService.getAverageDeploymentTime(id_app);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
      expect(result).toBe(expectedAverage);

      expect(metricsRepository.getSuccessfulDeploymentsByAppAndDateRange).toHaveBeenCalledTimes(1);

      const callArgs = metricsRepository.getSuccessfulDeploymentsByAppAndDateRange.mock.calls[0];
      const calledAppId = callArgs[0];
      const calledDateFrom = callArgs[1];
      const calledDateTo = callArgs[2];

      expect(calledAppId).toBe(id_app);

      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const toleranceMs = 3000;

      // dateFrom debe ser aproximadamente igual a sevenDaysAgo (con tolerancia de ±3000ms)
      const dateFromMs = new Date(calledDateFrom).getTime();
      expect(dateFromMs).toBeGreaterThanOrEqual(sevenDaysAgo - toleranceMs);
      expect(dateFromMs).toBeLessThanOrEqual(sevenDaysAgo + toleranceMs);

      // dateTo debe ser aproximadamente igual a ahora (con tolerancia de ±3000ms)
      const dateToMs = new Date(calledDateTo).getTime();
      expect(dateToMs).toBeGreaterThanOrEqual(now - toleranceMs);
      expect(dateToMs).toBeLessThanOrEqual(now + toleranceMs);
    });

    it('Caso 2: debe almacenar el resultado en caché después de calcularlo', async () => {
      const result = await metricsService.getAverageDeploymentTime(id_app);

      expect(cacheClient.set).toHaveBeenCalledTimes(1);

      const setCacheArgs = cacheClient.set.mock.calls[0];
      const cacheKey = setCacheArgs[0];
      const cachedValue = setCacheArgs[1];

      // La clave de caché debe contener el id_app para garantizar caché por aplicación
      expect(cacheKey).toContain(id_app);

      // El valor almacenado en caché debe coincidir con el promedio calculado
      expect(Number(cachedValue)).toBe(result);
      expect(Number(cachedValue)).toBe(expectedAverage);
    });

    it('Caso 3: debe retornar el valor desde caché si existe (caché hit)', async () => {
      // El caché retorna directamente el valor numérico (caché hit)
      const cachedValue = 120.5;
      cacheClient.get.mockResolvedValue(cachedValue);

      const result = await metricsService.getAverageDeploymentTime(id_app);

      // El resultado debe ser exactamente el valor retornado por el caché, sin conversión de tipos en el test
      expect(result).toBe(cachedValue);

      // El repositorio NO debe ser llamado cuando hay caché hit
      expect(metricsRepository.getSuccessfulDeploymentsByAppAndDateRange).not.toHaveBeenCalled();
    });
  });

  describe('getAverageDeploymentTime - cuando no hay despliegues en el período', () => {
    const id_app = 'app-001';

    it('Caso 4: debe retornar cero o null cuando el repositorio retorna un array vacío', async () => {
      metricsRepository.getSuccessfulDeploymentsByAppAndDateRange.mockResolvedValue([]);

      // Comportamiento esperado: el servicio retorna 0 cuando no hay despliegues,
      // ya que no hay datos para calcular un promedio y 0 es un valor semánticamente
      // correcto para indicar "sin tiempo promedio registrado".
      let result;
      let thrownError = null;

      try {
        result = await metricsService.getAverageDeploymentTime(id_app);
      } catch (err) {
        thrownError = err;
      }

      // No debe lanzar ninguna excepción
      expect(thrownError).toBeNull();

      // El resultado debe ser 0 o null
      expect(result === 0 || result === null).toBe(true);
    });

    it('Caso 5: debe retornar cero o null cuando el repositorio retorna null', async () => {
      metricsRepository.getSuccessfulDeploymentsByAppAndDateRange.mockResolvedValue(null);

      let result;
      let thrownError = null;

      try {
        result = await metricsService.getAverageDeploymentTime(id_app);
      } catch (err) {
        thrownError = err;
      }

      // No debe lanzar ninguna excepción
      expect(thrownError).toBeNull();

      // El resultado debe ser 0 o null
      expect(result === 0 || result === null).toBe(true);
    });
  });

  describe('getAverageDeploymentTime - manejo de errores', () => {
    const id_app = 'app-001';

    it('Caso 6: debe propagar el error cuando el repositorio lanza una excepción', async () => {
      const repositoryError = new Error('Database connection failed: unable to query deployments');
      metricsRepository.getSuccessfulDeploymentsByAppAndDateRange.mockRejectedValue(repositoryError);

      await expect(metricsService.getAverageDeploymentTime(id_app)).rejects.toThrow(
        'Database connection failed: unable to query deployments'
      );

      expect(metricsRepository.getSuccessfulDeploymentsByAppAndDateRange).toHaveBeenCalledTimes(1);
    });
  });
});