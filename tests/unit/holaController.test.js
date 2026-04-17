const holaController = require('../../src/controllers/holaController');

describe('holaController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: {
        username: 'test_user',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar 200 con mensaje de bienvenida cuando el usuario está autenticado', () => {
    holaController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        user: 'test_user',
      })
    );

    const jsonCallArg = res.json.mock.calls[0][0];
    expect(jsonCallArg.message.length).toBeGreaterThan(0);
  });

  it('debe retornar 401 con mensaje de error cuando req.user es undefined', () => {
    req.user = undefined;

    holaController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });

  it('debe llamar a res.json exactamente una vez cuando el usuario está autenticado', () => {
    holaController(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
  });

  it('debe retornar un payload con la estructura esperada cuando el usuario está autenticado', () => {
    holaController(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        user: expect.any(String),
      })
    );
  });
});