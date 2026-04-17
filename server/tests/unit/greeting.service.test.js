const GreetingRepository = require('../../../repositories/greeting.repository');
const GreetingService = require('../../../services/greeting.service');

jest.mock('../../../repositories/greeting.repository');

const mockGreeting = {
  _id: '507f1f77bcf86cd799439011',
  countryCode: 'MX',
  countryName: 'México',
  language: 'Español',
  greeting: 'Hola',
  formalGreeting: 'Buenos días',
  flagUrl: 'https://flagcdn.com/mx.svg',
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockGreetingInput = {
  countryCode: 'MX',
  countryName: 'México',
  language: 'Español',
  greeting: 'Hola',
  formalGreeting: 'Buenos días',
  flagUrl: 'https://flagcdn.com/mx.svg',
  isActive: true,
};

describe('GreetingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGreetings', () => {
    it('debe retornar un array de saludos cuando el repositorio retorna datos', async () => {
      const mockGreetings = [
        mockGreeting,
        { ...mockGreeting, _id: '507f1f77bcf86cd799439012', countryCode: 'AR', countryName: 'Argentina' },
      ];
      GreetingRepository.findAll.mockResolvedValue(mockGreetings);

      const result = await GreetingService.getAllGreetings();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(GreetingRepository.findAll).toHaveBeenCalledTimes(1);
      expect(GreetingRepository.findAll).toHaveBeenCalledWith();
    });

    it('debe retornar un array vacío cuando no hay saludos en la base de datos', async () => {
      GreetingRepository.findAll.mockResolvedValue([]);

      const result = await GreetingService.getAllGreetings();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('debe propagar el error cuando el repositorio lanza una excepción', async () => {
      const repositoryError = new Error('Error de conexión con la base de datos');
      GreetingRepository.findAll.mockRejectedValue(repositoryError);

      await expect(GreetingService.getAllGreetings()).rejects.toThrow('Error de conexión con la base de datos');
    });
  });

  describe('getGreetingByCountryCode', () => {
    it('debe retornar el saludo correcto para un countryCode válido existente', async () => {
      GreetingRepository.findByCountryCode.mockResolvedValue(mockGreeting);

      const result = await GreetingService.getGreetingByCountryCode('MX');

      expect(result).toBeDefined();
      expect(result.countryCode).toBe('MX');
      expect(GreetingRepository.findByCountryCode).toHaveBeenCalledTimes(1);
      expect(GreetingRepository.findByCountryCode).toHaveBeenCalledWith('MX');
    });

    it('debe retornar null cuando el countryCode no existe en la base de datos', async () => {
      GreetingRepository.findByCountryCode.mockResolvedValue(null);

      const result = await GreetingService.getGreetingByCountryCode('ZZ');

      expect(result).toBeNull();
    });

    it('debe normalizar el countryCode a mayúsculas antes de consultar el repositorio', async () => {
      GreetingRepository.findByCountryCode.mockResolvedValue(mockGreeting);

      await GreetingService.getGreetingByCountryCode('mx');

      expect(GreetingRepository.findByCountryCode).toHaveBeenCalledWith('MX');
    });

    it('debe lanzar un error de validación cuando el countryCode tiene formato inválido', async () => {
      await expect(GreetingService.getGreetingByCountryCode('INVALID123')).rejects.toThrow();
      expect(GreetingRepository.findByCountryCode).not.toHaveBeenCalled();
    });
  });

  describe('createGreeting', () => {
    it('debe crear y retornar un nuevo saludo con datos válidos', async () => {
      GreetingRepository.findByCountryCode.mockResolvedValue(null);
      GreetingRepository.create.mockResolvedValue(mockGreeting);

      const result = await GreetingService.createGreeting(mockGreetingInput);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.countryCode).toBe(mockGreetingInput.countryCode);
      expect(result.greeting).toBe(mockGreetingInput.greeting);
      expect(GreetingRepository.create).toHaveBeenCalledTimes(1);
      expect(GreetingRepository.create).toHaveBeenCalledWith(mockGreetingInput);
    });

    it('debe lanzar un error cuando ya existe un saludo para ese countryCode', async () => {
      GreetingRepository.findByCountryCode.mockResolvedValue(mockGreeting);

      await expect(GreetingService.createGreeting(mockGreetingInput)).rejects.toThrow();
      expect(GreetingRepository.create).not.toHaveBeenCalled();
    });

    it('debe lanzar un error cuando los datos de entrada son inválidos', async () => {
      const invalidInput = { countryCode: '', greeting: '' };

      await expect(GreetingService.createGreeting(invalidInput)).rejects.toThrow();
      expect(GreetingRepository.create).not.toHaveBeenCalled();
    });

    it('debe propagar el error cuando el repositorio falla al crear', async () => {
      GreetingRepository.findByCountryCode.mockResolvedValue(null);
      GreetingRepository.create.mockRejectedValue(new Error('Error al guardar en la base de datos'));

      await expect(GreetingService.createGreeting(mockGreetingInput)).rejects.toThrow('Error al guardar en la base de datos');
    });
  });

  describe('updateGreeting', () => {
    const mockUpdateInput = {
      greeting: 'Hola actualizado',
      formalGreeting: 'Buenos días actualizado',
    };

    const mockUpdatedGreeting = {
      ...mockGreeting,
      ...mockUpdateInput,
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    };

    it('debe actualizar y retornar el saludo modificado cuando el id es válido', async () => {
      GreetingRepository.findById.mockResolvedValue(mockGreeting);
      GreetingRepository.update.mockResolvedValue(mockUpdatedGreeting);

      const result = await GreetingService.updateGreeting('507f1f77bcf86cd799439011', mockUpdateInput);

      expect(result).toBeDefined();
      expect(result.greeting).toBe(mockUpdateInput.greeting);
      expect(result.formalGreeting).toBe(mockUpdateInput.formalGreeting);
      expect(GreetingRepository.update).toHaveBeenCalledTimes(1);
      expect(GreetingRepository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', mockUpdateInput);
    });

    it('debe lanzar un error cuando el saludo a actualizar no existe', async () => {
      GreetingRepository.findById.mockResolvedValue(null);

      await expect(GreetingService.updateGreeting('507f1f77bcf86cd799439099', mockUpdateInput)).rejects.toThrow();
      expect(GreetingRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar un error cuando el id proporcionado es inválido', async () => {
      await expect(GreetingService.updateGreeting('id-invalido', mockUpdateInput)).rejects.toThrow();
      expect(GreetingRepository.findById).not.toHaveBeenCalled();
      expect(GreetingRepository.update).not.toHaveBeenCalled();
    });

    it('debe propagar el error cuando el repositorio falla al actualizar', async () => {
      GreetingRepository.findById.mockResolvedValue(mockGreeting);
      GreetingRepository.update.mockRejectedValue(new Error('Error al actualizar en la base de datos'));

      await expect(GreetingService.updateGreeting('507f1f77bcf86cd799439011', mockUpdateInput)).rejects.toThrow('Error al actualizar en la base de datos');
    });
  });

  describe('deleteGreeting', () => {
    it('debe eliminar el saludo y retornar confirmación cuando el id es válido', async () => {
      GreetingRepository.findById.mockResolvedValue(mockGreeting);
      GreetingRepository.delete.mockResolvedValue({ deleted: true, id: '507f1f77bcf86cd799439011' });

      const result = await GreetingService.deleteGreeting('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(GreetingRepository.delete).toHaveBeenCalledTimes(1);
      expect(GreetingRepository.delete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('debe lanzar un error cuando el saludo a eliminar no existe', async () => {
      GreetingRepository.findById.mockResolvedValue(null);

      await expect(GreetingService.deleteGreeting('507f1f77bcf86cd799439099')).rejects.toThrow();
      expect(GreetingRepository.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar un error cuando el id proporcionado es inválido', async () => {
      await expect(GreetingService.deleteGreeting('id-invalido')).rejects.toThrow();
      expect(GreetingRepository.findById).not.toHaveBeenCalled();
      expect(GreetingRepository.delete).not.toHaveBeenCalled();
    });

    it('debe propagar el error cuando el repositorio falla al eliminar', async () => {
      GreetingRepository.findById.mockResolvedValue(mockGreeting);
      GreetingRepository.delete.mockRejectedValue(new Error('Error al eliminar de la base de datos'));

      await expect(GreetingService.deleteGreeting('507f1f77bcf86cd799439011')).rejects.toThrow('Error al eliminar de la base de datos');
    });
  });
});