const { logClass } = require('@7eleven/7boss-logger');
// import * as RedisClient from '@7eleven/7boss-redis-client';

const RedisClient = require('@7eleven/7boss-redis-client');
const redis = new RedisClient(process.env.REDIS_URL, 6379, {
  slotsRefreshTimeout: 2000,
});

class RedisUtil {
  static async _checkRedisConnection() {
    try {
      const REDIS_TEST_KEY = 'redis-test-key';
      const REDIS_TEST_VALUE = 'redis-test-value';
      await this.setToRedis(REDIS_TEST_KEY, REDIS_TEST_VALUE);
      const value = await this.getFromRedis(REDIS_TEST_KEY);
      if (value) {
        logger.debug('Redis connection successful');
        return Promise.resolve(true);
      }
      logger.debug('Redis connection failed');
      return Promise.reject(false);
    } catch (error) {
      logger.error(error, 'Error checking connection to redis');
      return Promise.reject(error);
    }
  }

  static async setToRedis(key, value, expiryTime = null) {
    try {
      logger.debug(`REDIS SERVER URL: ${JSON.stringify(process.env.REDIS_URL)}`);
      if (!expiryTime) {
        await redis.set(key, value);
      }
      await redis.set(key, value, expiryTime);
      return;
    } catch (exception) {
      logger.error(exception, 'Error setting value to redis');
      throw exception;
    }
  }

  static async getFromRedis(key) {
    try {
      logger.debug(`Getting value from redis by key ${key}`);
      const data = await redis.get(key);
      return Promise.resolve(data);
    } catch (exception) {
      logger.error(`${JSON.stringify(exception)}, Error getting value from redis for key ${key}`);
      return Promise.reject(exception);
    }
  }

  static async formatUserData(data) {
    logger.debug(`Formatting userData ${JSON.stringify(data)}`);
    return JSON.stringify(data);
  }
}

export { RedisUtil };
