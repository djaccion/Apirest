tests/unit/utils/bcrypt.utils.test.js

```javascript
const bcrypt = require('bcryptjs');
const { hashPassword, comparePassword } = require('../../../src/utils/bcrypt.utils');

jest.mock('bcryptjs');

describe('BcryptUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    test('Caso 1 - Hash exitoso: debe hashear una contraseña válida correctamente', async () => {
      const plainPassword = 'MySecurePassword123!';
      const mockedHash = '$2a$12$mockedHashValue';

      bcrypt.hash.mockResolvedValue(mockedHash);

      const result = await hashPassword(plainPassword);

      expect(result).toBe(mockedHash);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, expect.any(Number));
    });

    test('Caso 2 - Contraseña vacía: debe rechazar con error de validación', async () => {
      await expect(hashPassword('')).rejects.toThrow();
      expect(bcrypt.hash).toHaveBeenCalledTimes(0);
    });

    test.each([
      [null],
      [undefined],
    ])('Caso 3 - Contraseña nula o undefined: debe rechazar con error de validación cuando se pasa %s', async (invalidPassword) => {
      await expect(hashPassword(invalidPassword)).rejects.toThrow();
      expect(bcrypt.hash).toHaveBeenCalledTimes(0);
    });

    test('Caso 4 - Propagación de error de bcrypt: debe propagar el error sin silenciarlo', async () => {
      const plainPassword = 'MySecurePassword123!';
      const bcryptError = new Error('bcrypt internal error');

      bcrypt.hash.mockRejectedValue(bcryptError);

      await expect(hashPassword(plainPassword)).rejects.toThrow('bcrypt internal error');
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });
  });

  describe('comparePassword', () => {
    test('Caso 1 - Comparación exitosa (contraseña correcta): debe retornar true', async () => {
      const plainPassword = 'MySecurePassword123!';
      const storedHash = '$2a$12$mockedHashValue';

      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(plainPassword, storedHash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, storedHash);
    });

    test('Caso 2 - Comparación fallida (contraseña incorrecta): debe retornar false sin lanzar excepción', async () => {
      const plainPassword = 'WrongPassword123!';
      const storedHash = '$2a$12$mockedHashValue';

      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(plainPassword, storedHash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, storedHash);
    });

    test('Caso 3 - Hash inválido o malformado: debe propagar el error de bcrypt', async () => {
      const plainPassword = 'MySecurePassword123!';
      const corruptedHash = 'corrupted_hash_value';
      const bcryptError = new Error('Invalid hash provided');

      bcrypt.compare.mockRejectedValue(bcryptError);

      await expect(comparePassword(plainPassword, corruptedHash)).rejects.toThrow('Invalid hash provided');
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    test.each([
      [null, '$2a$12$mockedHashValue'],
      ['MySecurePassword123!', null],
      [null, null],
    ])('Caso 4 - Argumentos nulos o undefined: debe rechazar con error de validación cuando plainPassword=%s y hash=%s', async (plainPassword, hash) => {
      await expect(comparePassword(plainPassword, hash)).rejects.toThrow();
      expect(bcrypt.compare).toHaveBeenCalledTimes(0);
    });

    test('Caso 5 - Strings vacíos: debe rechazar con error de validación cuando plainPassword es vacío', async () => {
      await expect(comparePassword('', '$2a$12$mockedHashValue')).rejects.toThrow();
      expect(bcrypt.compare).toHaveBeenCalledTimes(0);
    });

    test('Caso 5 - Strings vacíos: debe rechazar con error de validación cuando hash es vacío', async () => {
      await expect(comparePassword('MySecurePassword123!', '')).rejects.toThrow();
      expect(bcrypt.compare).toHaveBeenCalledTimes(0);
    });

    test('Caso 5 - Strings vacíos: debe rechazar con error de validación cuando ambos argumentos son vacíos', async () => {
      await expect(comparePassword('', '')).rejects.toThrow();
      expect(bcrypt.compare).toHaveBeenCalledTimes(0);
    });
  });
});