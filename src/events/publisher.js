const amqplib = require('amqplib');

let connection = null;
let channel = null;

async function connect() {
  if (connection && channel) {
    return;
  }

  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost';

    connection = await amqplib.connect(url);

    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      console.error('[RabbitMQ] Connection closed unexpectedly');
      connection = null;
      channel = null;
    });

    channel = await connection.createChannel();
  } catch (err) {
    console.error('[RabbitMQ] Failed to connect to RabbitMQ:', err);
    throw err;
  }
}

async function publishEvent(exchange, routingKey, payload) {
  try {
    await connect();

    await channel.assertExchange(exchange, 'topic', { durable: true });

    const buffer = Buffer.from(JSON.stringify(payload));

    channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      contentType: 'application/json',
    });

    console.log(`[RabbitMQ] Event published - exchange: ${exchange}, routingKey: ${routingKey}`);
  } catch (err) {
    console.error(`[RabbitMQ] Failed to publish event - exchange: ${exchange}, routingKey: ${routingKey}`, err);
    throw err;
  }
}

async function closeConnection() {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
  } catch (err) {
    console.error('[RabbitMQ] Error while closing connection:', err);
  } finally {
    channel = null;
    connection = null;
  }
}

module.exports = {
  publishEvent,
  closeConnection,
};