const publishedMessages = [];

const mockChannel = {
  assertExchange: jest.fn().mockResolvedValue({}),
  assertQueue: jest.fn().mockResolvedValue({ queue: 'mock-queue' }),
  bindQueue: jest.fn().mockResolvedValue({}),
  publish: jest.fn().mockImplementation((exchange, routingKey, content, options) => {
    let parsedContent;
    try {
      parsedContent = JSON.parse(content.toString());
    } catch {
      parsedContent = content.toString();
    }
    publishedMessages.push({
      exchange,
      routingKey,
      content: parsedContent,
      options: options || {},
      timestamp: new Date().toISOString(),
    });
    return true;
  }),
  sendToQueue: jest.fn().mockImplementation((queue, content, options) => {
    let parsedContent;
    try {
      parsedContent = JSON.parse(content.toString());
    } catch {
      parsedContent = content.toString();
    }
    publishedMessages.push({
      exchange: queue,
      routingKey: '',
      content: parsedContent,
      options: options || {},
      timestamp: new Date().toISOString(),
    });
    return true;
  }),
  consume: jest.fn().mockResolvedValue({ consumerTag: 'mock-consumer-tag' }),
  ack: jest.fn(),
  nack: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  prefetch: jest.fn().mockResolvedValue(undefined),
};

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

const mockAmqplib = {
  connect: jest.fn().mockResolvedValue(mockConnection),
};

const getPublishedMessages = () => [...publishedMessages];

const getLastPublishedMessage = () => {
  if (publishedMessages.length === 0) return null;
  return { ...publishedMessages[publishedMessages.length - 1] };
};

const clearPublishedMessages = () => {
  publishedMessages.length = 0;
};

const simulateConnectionError = (errorMessage = 'Connection refused') => {
  const error = new Error(errorMessage);
  mockAmqplib.connect.mockRejectedValue(error);
};

const simulateChannelError = (errorMessage = 'Channel creation failed') => {
  const error = new Error(errorMessage);
  mockConnection.createChannel.mockRejectedValue(error);
};

const restoreDefaults = () => {
  clearPublishedMessages();

  mockChannel.assertExchange.mockResolvedValue({});
  mockChannel.assertQueue.mockResolvedValue({ queue: 'mock-queue' });
  mockChannel.bindQueue.mockResolvedValue({});
  mockChannel.publish.mockImplementation((exchange, routingKey, content, options) => {
    let parsedContent;
    try {
      parsedContent = JSON.parse(content.toString());
    } catch {
      parsedContent = content.toString();
    }
    publishedMessages.push({
      exchange,
      routingKey,
      content: parsedContent,
      options: options || {},
      timestamp: new Date().toISOString(),
    });
    return true;
  });
  mockChannel.sendToQueue.mockImplementation((queue, content, options) => {
    let parsedContent;
    try {
      parsedContent = JSON.parse(content.toString());
    } catch {
      parsedContent = content.toString();
    }
    publishedMessages.push({
      exchange: queue,
      routingKey: '',
      content: parsedContent,
      options: options || {},
      timestamp: new Date().toISOString(),
    });
    return true;
  });
  mockChannel.consume.mockResolvedValue({ consumerTag: 'mock-consumer-tag' });
  mockChannel.ack.mockReset();
  mockChannel.nack.mockReset();
  mockChannel.close.mockResolvedValue(undefined);
  mockChannel.prefetch.mockResolvedValue(undefined);

  mockConnection.createChannel.mockResolvedValue(mockChannel);
  mockConnection.close.mockResolvedValue(undefined);
  mockConnection.on.mockReset();

  mockAmqplib.connect.mockResolvedValue(mockConnection);
};

module.exports = mockAmqplib;
module.exports.mockChannel = mockChannel;
module.exports.mockConnection = mockConnection;
module.exports.mockAmqplib = mockAmqplib;
module.exports.getPublishedMessages = getPublishedMessages;
module.exports.getLastPublishedMessage = getLastPublishedMessage;
module.exports.clearPublishedMessages = clearPublishedMessages;
module.exports.simulateConnectionError = simulateConnectionError;
module.exports.simulateChannelError = simulateChannelError;
module.exports.restoreDefaults = restoreDefaults;