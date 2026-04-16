const amqp = require('amqplib');
const logger = require('../../config/logger');

const EXCHANGE_NAME = 'users.events';
const EXCHANGE_TYPE = 'topic';
const QUEUE_NAME = 'users.crud.queue';
const ROUTING_KEY = 'user.*';
const DLX_NAME = 'users.events.dlx';
const DLX_TYPE = 'direct';
const DLQ_NAME = 'users.crud.dlq';
const DLQ_ROUTING_KEY = 'users.crud.queue';

async function dispatchUserEvent(eventType, payload, userService) {
  switch (eventType) {
    case 'user.created':
      logger.info(`[UserEventsConsumer] Processing user.created event for user id: ${payload && payload.id}`);
      if (userService && typeof userService.handleUserCreatedEvent === 'function') {
        await userService.handleUserCreatedEvent(payload);
      } else {
        logger.info(`[UserEventsConsumer] user.created: no post-processing handler registered`);
      }
      break;

    case 'user.updated':
      logger.info(`[UserEventsConsumer] Processing user.updated event for user id: ${payload && payload.id}`);
      if (userService && typeof userService.invalidateUserCache === 'function') {
        await userService.invalidateUserCache(payload.id);
      } else {
        logger.info(`[UserEventsConsumer] user.updated: no cache invalidation handler registered`);
      }
      break;

    case 'user.deleted':
      logger.info(`[UserEventsConsumer] Processing user.deleted event for user id: ${payload && payload.id}`);
      if (userService && typeof userService.invalidateUserCache === 'function') {
        await userService.invalidateUserCache(payload.id);
      }
      if (userService && typeof userService.cleanupUserResources === 'function') {
        await userService.cleanupUserResources(payload.id);
      } else {
        logger.info(`[UserEventsConsumer] user.deleted: no cleanup handler registered`);
      }
      break;

    case 'user.sync_requested':
      logger.info(`[UserEventsConsumer] Processing user.sync_requested event`);
      if (userService && typeof userService.syncWithExternalServices === 'function') {
        await userService.syncWithExternalServices(payload);
      } else {
        logger.info(`[UserEventsConsumer] user.sync_requested: no sync handler registered`);
      }
      break;

    default:
      logger.warn(`[UserEventsConsumer] Unknown eventType received: ${eventType}. Acknowledging without processing.`);
      break;
  }
}

async function startUserEventsConsumer(userService) {
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  const reconnectDelay = parseInt(process.env.RABBITMQ_RECONNECT_DELAY, 10) || 5000;
  const maxRetries = parseInt(process.env.RABBITMQ_MAX_RETRIES, 10) || 10;

  let retryCount = 0;

  async function connect() {
    try {
      logger.info(`[UserEventsConsumer] Attempting to connect to RabbitMQ (attempt ${retryCount + 1}/${maxRetries})`);

      const connection = await amqp.connect(rabbitmqUrl);

      retryCount = 0;

      logger.info('[UserEventsConsumer] Connection to RabbitMQ established successfully');

      connection.on('error', (err) => {
        logger.error(`[UserEventsConsumer] RabbitMQ connection error: ${err.message}`);
      });

      connection.on('close', () => {
        logger.warn('[UserEventsConsumer] RabbitMQ connection closed. Attempting reconnection...');
        scheduleReconnect();
      });

      const channel = await connection.createChannel();
      await channel.prefetch(1);

      await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

      await channel.assertExchange(DLX_NAME, DLX_TYPE, { durable: true });

      await channel.assertQueue(DLQ_NAME, { durable: true });

      await channel.bindQueue(DLQ_NAME, DLX_NAME, DLQ_ROUTING_KEY);

      await channel.assertQueue(QUEUE_NAME, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': DLX_NAME,
        },
      });

      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

      logger.info(`[UserEventsConsumer] Queue "${QUEUE_NAME}" declared and bound to exchange "${EXCHANGE_NAME}" with routing key "${ROUTING_KEY}"`);

      channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) {
          logger.warn('[UserEventsConsumer] Received null message, consumer may have been cancelled');
          return;
        }

        let parsedMessage;
        let eventType;
        let payload;

        try {
          const rawContent = msg.content.toString();
          parsedMessage = JSON.parse(rawContent);
          eventType = parsedMessage.eventType;
          payload = parsedMessage.payload;

          logger.info(`[UserEventsConsumer] Message received with eventType: ${eventType}`);

          if (process.env.NODE_ENV !== 'production') {
            logger.debug(`[UserEventsConsumer] Full payload: ${JSON.stringify(payload)}`);
          }
        } catch (parseError) {
          logger.error(`[UserEventsConsumer] Failed to parse message: ${parseError.message}`);
          channel.nack(msg, false, false);
          return;
        }

        try {
          await dispatchUserEvent(eventType, payload, userService);
          channel.ack(msg);
          logger.info(`[UserEventsConsumer] Message with eventType "${eventType}" processed and acknowledged`);
        } catch (handlerError) {
          logger.error(`[UserEventsConsumer] Error processing event "${eventType}": ${handlerError.message}`);

          const isRecoverable =
            handlerError.message &&
            (handlerError.message.toLowerCase().includes('timeout') ||
              handlerError.message.toLowerCase().includes('temporarily unavailable') ||
              handlerError.message.toLowerCase().includes('econnrefused'));

          if (isRecoverable) {
            logger.warn(`[UserEventsConsumer] Recoverable error for event "${eventType}". Re-queuing message.`);
            channel.nack(msg, false, true);
          } else {
            logger.error(`[UserEventsConsumer] Non-recoverable error for event "${eventType}". Sending to DLQ.`);
            channel.nack(msg, false, false);
          }
        }
      });

      logger.info(`[UserEventsConsumer] Consumer registered on queue "${QUEUE_NAME}"`);
    } catch (connectionError) {
      logger.error(`[UserEventsConsumer] Failed to connect to RabbitMQ: ${connectionError.message}`);
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    retryCount += 1;

    if (retryCount > maxRetries) {
      logger.error(
        `[UserEventsConsumer] Maximum reconnection attempts (${maxRetries}) exceeded. Consumer will not restart. Manual intervention required.`
      );
      process.emit('userEventsConsumerFailed', {
        message: 'RabbitMQ consumer failed after maximum retries',
        maxRetries,
      });
      return;
    }

    logger.warn(
      `[UserEventsConsumer] Scheduling reconnection attempt ${retryCount}/${maxRetries} in ${reconnectDelay}ms`
    );

    setTimeout(() => {
      connect();
    }, reconnectDelay);
  }

  await connect();
}

module.exports = { startUserEventsConsumer };