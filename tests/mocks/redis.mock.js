const store = {};

const redisMock = {
  get: jest.fn().mockImplementation((key) => {
    const value = store.hasOwnProperty(key) ? store[key] : null;
    return Promise.resolve(value);
  }),

  set: jest.fn().mockImplementation((key, value) => {
    store[key] = value;
    return Promise.resolve('OK');
  }),

  setex: jest.fn().mockImplementation((key, seconds, value) => {
    store[key] = value;
    return Promise.resolve('OK');
  }),

  del: jest.fn().mockImplementation((key) => {
    if (store.hasOwnProperty(key)) {
      delete store[key];
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  }),

  flushall: jest.fn().mockImplementation(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    return Promise.resolve('OK');
  }),

  quit: jest.fn().mockImplementation(() => {
    return Promise.resolve('OK');
  }),

  on: jest.fn().mockImplementation((event, callback) => {
    return redisMock;
  }),
};

const clearMockStore = () => {
  Object.keys(store).forEach((key) => delete store[key]);
  Object.values(redisMock).forEach((fn) => {
    if (typeof fn.mockClear === 'function') {
      fn.mockClear();
    }
  });
};

module.exports = redisMock;
module.exports.clearMockStore = clearMockStore;
module.exports.default = redisMock;