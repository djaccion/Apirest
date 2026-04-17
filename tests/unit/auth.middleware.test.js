process.env.JWT_SECRET = "test_secret_key";

const jwt = require("jsonwebtoken");
const authMiddleware = require("../../src/middlewares/auth.middleware");

describe("Auth Middleware - JWT Validation", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("cuando el token es inválido o está ausente", () => {
    it("Test 1 - Sin header Authorization", () => {
      req.headers = {};

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it("Test 2 - Header Authorization presente pero sin el prefijo Bearer", () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
      req.headers.authorization = token;

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("Test 3 - Token con formato Bearer pero el token en sí está vacío", () => {
      req.headers.authorization = "Bearer ";

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("Test 4 - Token firmado con un secret incorrecto", () => {
      const token = jwt.sign({ userId: 1 }, "wrong_secret_key");
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("Test 5 - Token expirado", () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, {
        expiresIn: "-1s",
      });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("Test 6 - Token con estructura JWT inválida (string aleatorio)", () => {
      req.headers.authorization = "Bearer esto.no.esunjwt";

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("cuando el token es válido", () => {
    it("Test 7 - Token válido y vigente", () => {
      const payload = { userId: 1, role: "user" };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(req.user || req.decodedToken).toBeDefined();
    });

    it("Test 8 - Verificación del payload decodificado en req", () => {
      const payload = { userId: 42, role: "admin", username: "testuser" };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();

      const decoded = req.user || req.decodedToken;

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.username).toBe(payload.username);
    });
  });
});