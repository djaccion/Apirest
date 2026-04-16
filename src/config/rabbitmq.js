const amqplib = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'app_events';
const RABBITMQ_EXCHANGE_TYPE = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';
const RABBITMQ_RECONNECT_DELAY_MS = parseInt(process.env.RABBITMQ_RECONNECT_DELAY_MS || '5000', 10);
const RABBITMQ_MAX_RECONNECT_ATTEMPTS = parseInt(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS || '10', 10);

let connection = null;
let channel = null;
let reconnectAttempts = 0;
let isConnecting = false;

async function connect() {
  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    connection = await amqplib.connect(RABBITMQ_URL);

    channel = await connection.createChannel();

    await channel.assertExchange(RABBITMQ_EXCHANGE, RABBITMQ_EXCHANGE_TYPE, { durable: true });

    reconnectAttempts = 0;
    isConnecting = false;

    console.log('[RabbitMQ] Connection established successfully.');

    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err);
      reconnect();
    });

    connection.on('close', () => {
      console.log('[RabbitMQ] Connection closed.');
      reconnect();
    });

    channel.on('error', (err) => {
      console.error('[RabbitMQ] Channel error:', err);
    });

    channel.on('close', () => {
      console.log('[RabbitMQ] Channel closed.');
    });
  } catch (err) {
    isConnecting = false;
    await reconnect(err);
  }
}

async function reconnect(err) {
  reconnectAttempts += 1;

  if (reconnectAttempts > RABBITMQ_MAX_RECONNECT_ATTEMPTS) {
    console.error('[RabbitMQ] Max reconnect attempts reached. Giving up.');
    throw new Error(
      `[RabbitMQ] Failed to reconnect after ${RABBITMQ_MAX_RECONNECT_ATTEMPTS} attempts. Last error: ${err ? err.message : 'unknown'}`
    );
  }

  console.log(`[RabbitMQ] Reconnecting... attempt ${reconnectAttempts} of ${RABBITMQ_MAX_RECONNECT_ATTEMPTS}`);

  await new Promise((resolve) => setTimeout(resolve, RABBITMQ_RECONNECT_DELAY_MS));

  await connect();
}

function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel is not initialized. Call connect() first.');
  }
  return channel;
}

function getConnection() {
  if (!connection) {
    throw new Error('RabbitMQ connection is not initialized. Call connect() first.');
  }
  return connection;
}

async function closeConnection() {
  if (channel) {
    try {
      await channel.close();
      console.log('[RabbitMQ] Channel closed successfully.');
    } catch (err) {
      console.error('[RabbitMQ] Error closing channel:', err);
    }
  }

  if (connection) {
    try {
      await connection.close();
      console.log('[RabbitMQ] Connection closed successfully.');
    } catch (err) {
      console.error('[RabbitMQ] Error closing connection:', err);
    }
  }

  channel = null;
  connection = null;

  console.log('[RabbitMQ] Resources released.');
}

module.exports = {
  connect,
  reconnect,
  getChannel,
  getConnection,
  closeConnection,
};