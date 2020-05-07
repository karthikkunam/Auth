const moment = require('moment');
const jwt = require('jsonwebtoken');
const { decode } = require('../util/string');
const { authService } = require('../services/auth');
const { FLAGGED_STORE_ID, REDIS_STORE_ID_KEY, REPLACE_STORE_ID, ISP_USER_ACCESS_ID_SESSION_EXPIRY_TIME } = require('../util/constants/auth');
const { secretsManager } = require('../util/secretsManager');
const { SIGN_OPTIONS, ACCESS_TOKEN_EXPIRY } = require('../util/constants/auth');
const userCoordinator = require('./user');
const storeCoordinator = require('./store');
const storeFactory = require('../factories/store');
const { AuthUtil } = require('../util/auth');
const { RedisUtil } = require('../util/redis');
const idUtil = require('../util/id');
const { REDIS_ACCESS_ID_EXPIRY_TIME } = require('../util/constants/redis');
const { encode } = require('../util/string');
const appPackage = require('../package.json');

async function authenticate(payload, decryptedPayload) {
  logger.info(`Authenticating user from ${payload.deviceType}`);
  let updatedPayload;
  let refreshToken = await getRefreshToken(payload.storeId);
  updatedPayload = await generateJWT(payload, refreshToken);
  updatedPayload.timezone = decryptedPayload.timezone;
  updatedPayload.deviceType = decryptedPayload.deviceType;
  logger.debug(`JWT oAuth token ${JSON.stringify(updatedPayload.token)}`);

  let encodedPayload = encode(JSON.stringify(decryptedPayload));
  await RedisUtil.setToRedis(updatedPayload.refreshToken, encodedPayload);

  logger.debug(`COOKIE IN TOKEN: ', ${JSON.stringify(updatedPayload)}`);
  logger.info('Successfully authenticated token');
  return updatedPayload;
}

async function authenticateRemoteUser(userPayload) {
  try {
    const { storeId, userId, firstName, lastName, username, email, userType, feature } = userPayload;
    logger.info(`Authenticate user ${firstName} ${lastName} with storeId ${storeId} userId ${userId}`);
    const allowedStore = await storeCoordinator.getStoreProfile(storeId);
    const userProfile = await userCoordinator.getUserData(userId, storeId);
    const payload = await storeFactory.buildRemoteUserPayload(
      storeId,
      userId,
      firstName,
      lastName,
      username,
      email,
      userType,
      allowedStore,
      userProfile,
      feature
    );
    const refreshAccessToken = await getRefreshToken(storeId);
    const encodedRefreshPayload = encode(JSON.stringify(payload));
    logger.info(`Storing refreshPayload in redis with refreshAccessToken ${refreshAccessToken}`);
    logger.debug(`Encoded refresh payload: ${JSON.stringify(encodedRefreshPayload)}`);
    await RedisUtil.setToRedis(refreshAccessToken, encodedRefreshPayload);
    const accessToken = await generateJWT(payload, refreshAccessToken);
    logger.debug(`AccessToken: ${JSON.stringify(accessToken)}`);
    const accessId = idUtil.getUniqueId();
    const formattedUserAccessToken = await RedisUtil.formatUserData(accessToken);
    await RedisUtil.setToRedis(accessId, formattedUserAccessToken, REDIS_ACCESS_ID_EXPIRY_TIME);
    logger.info(`Stored userAccessToken in redis with accessId ${accessId}`);
    return accessId;
  } catch (error) {
    logger.error(error, `Error authenticating user ${userPayload.firstName} ${userPayload.lastName} for store ${userPayload.storeId}`);
    throw error;
  }
}

async function decryptPayload(encryptedData) {
  try {
    logger.info('Getting decrypted payload');
    let decryptedPayload = await AuthUtil.decrypt(encryptedData);
    logger.debug(`DecryptedPayload ${JSON.stringify(decryptedPayload)}`);
    logger.info('Decrypted payload successfully');
    return decryptedPayload;
  } catch (error) {
    logger.error(error, 'Error decrypting payload');
    throw new Error(error);
  }
}

async function getAuthenticatedPayload(encryptedData) {
  try {
    if (!encryptedData) {
      logger.debug('No token found for');
      throw new Error('No token found');
    }
    const decryptedPayload = await decryptPayload(encryptedData);
    logger.debug(`decrypted payload --> ${JSON.stringify(decryptedPayload)}`);

    // storeId precheck
    // TODO: This should be only for ordering
    const udpatedStoreId = await storeIdPreCheck(decryptedPayload.storeId);
    logger.info(`Updated storeId with pre-check ${udpatedStoreId}`);

    decryptedPayload.storeId = udpatedStoreId;
    logger.debug(`package Version: ${appPackage.version}`);
    // Check ageOfToken
    const isTokenAlive = await verifyAgeOfToken(decryptedPayload.timeStamp);
    if (!isTokenAlive) {
      logger.error('Launch token is expired');
      throw new Error('Launch token is expired');
    }
    let userData;
    let isOrderingEnabled = false;
    let userDataExists = false;
    const allowedStore = await storeCoordinator.getStoreProfile(decryptedPayload.storeId);
    if (allowedStore && allowedStore.features && allowedStore.features.boss) {
      isOrderingEnabled = allowedStore.features.boss.isOrderingEnabled;
    }
    // Check if requested feature is enabled for store
    if (isOrderingEnabled) {
      userData = await userCoordinator.getUserData(decryptedPayload.userId, decryptedPayload.storeId);
      if (userData && !userData.code) {
        userDataExists = true;
      }
    }
    // Check if User exists
    if (!userDataExists || !isOrderingEnabled) {
      logger.debug(`User or Ordering is not allowed at store: ${decryptedPayload.storeId} with userId ${decryptedPayload.userId}`);
      throw new Error(`User or Ordering is not allowed at store: ${decryptedPayload.storeId} with userId ${decryptedPayload.userId}`);
    }
    let updatedPayload = await authService.buildPayload(decryptedPayload, userData, allowedStore);
    updatedPayload.app = {
      environment: process.env.ENVIRONMENT ? process.env.ENVIRONMENT : 'local',
      version: appPackage.version ? appPackage.version : '0.0.1-alpha',
    };
    // JWT
    const accessToken = await authenticate(updatedPayload, decryptedPayload);
    const feature = decryptedPayload.feature;
    // UUID
    const accessId = await idUtil.getUniqueId();
    const formattedUserAccessToken = await RedisUtil.formatUserData(accessToken);
    await RedisUtil.setToRedis(accessId, formattedUserAccessToken, ISP_USER_ACCESS_ID_SESSION_EXPIRY_TIME);
    const accessInfo = { accessId, feature };
    return accessInfo;
  } catch (error) {
    logger.error(error, `Error getting authenticated payload for uuid ${uuid}`);
    throw error;
  }
}

async function generateJWT(payload, refreshToken) {
  try {
    let updatedPayload;
    let lr = payload;
    if (lr.password) {
      delete lr['password'];
    }
    logger.debug(`Generating token from payload ${JSON.stringify(lr)}`);
    const JWT = await signJWT(lr);
    let newRefreshToken = refreshToken || randomize('0', 20);
    logger.debug(`payload : ${JSON.stringify(payload)}`);
    updatedPayload = {
      userId: payload.userId,
      storeId: payload.storeId,
      token: JWT,
      refreshToken: newRefreshToken,
    };
    logger.debug('Token generation successful');
    return updatedPayload;
  } catch (error) {
    logger.error(error, `Error generating token, ERROR: ${JSON.stringify(error)}`);
    throw error;
  }
}

async function getRefreshToken(storeId) {
  let currentUtcTime = parseInt(moment.utc().valueOf().toString().slice(0, -3));
  logger.debug(`************************ 7boss_${storeId}_${currentUtcTime}`);
  return `7boss_${storeId}_${currentUtcTime}`;
}

async function getRemoteAccessRefreshToken(username) {
  logger.info(`Getting refreshToken for remote user ${username}`);
  let currentUtcTime = parseInt(moment.utc().valueOf().toString().slice(0, -3));
  logger.debug(`************************ 7boss_${username}_${currentUtcTime}`);
  logger.info('New refresh token successful');
  return `7boss_${username}_${currentUtcTime}`;
}

async function getAccessToken(accessId) {
  try {
    logger.info(`Getting access token for uuid ${accessId}`);
    let accessToken;
    accessToken = await RedisUtil.getFromRedis(accessId);
    return accessToken;
  } catch (error) {
    logger.error(error, `Error getting user access token with id ${accessId}`);
    throw error;
  }
}

async function getJWTForRemoteUser(uuid) {
  const jwt = await RedisUtil.getFromRedis(uuid);
  return jwt;
}

async function isTokenValid(authorizationToken) {
  let isTokenValid = true;
  if (authorizationToken) {
    try {
      let decodedAuthPayload = await authService.validateJWT(authorizationToken);
      if (!decodedAuthPayload) {
        isTokenValid = false;
      }
      return isTokenValid;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}

async function signJWT(result) {
  try {
    let JWT;
    logger.debug('Attempting to sign JWT');
    if (result) {
      let payload = result;
      let privateKey = await secretsManager.getPrivateKey();
      JWT = jwt.sign(payload, privateKey, SIGN_OPTIONS);
      return JWT;
    }
    logger.debug('Finished signing JWT');
    resolve(JWT);
  } catch (error) {
    logger.error(error, 'Error signing JWT');
    throw error;
  }
}

async function storeIdPreCheck(storeId) {
  try {
    if (
      (process.env.ENVIRONMENT === 'local' || process.env.ENVIRONMENT === 'dev' || process.env.ENVIRONMENT === 'qa') &&
      storeId === FLAGGED_STORE_ID
    ) {
      logger.debug(`StoreId ${storeId} flagged`);
      const storeIdInRedis = await RedisUtil.getFromRedis(REDIS_STORE_ID_KEY);
      logger.debug(`storeID's in Redis ${storeIdInRedis}, StoreIDKey: ${REDIS_STORE_ID_KEY}`);

      if (!storeIdInRedis || storeIdInRedis === undefined) {
        logger.debug(`REPLACE_STORE_ID[0] : ${REPLACE_STORE_ID[0]} ${JSON.stringify(REPLACE_STORE_ID)}`);
        storeId = REPLACE_STORE_ID[FLAGGED_STORE_ID];
      } else {
        storeId = REPLACE_STORE_ID[storeIdInRedis];
      }
      await RedisUtil.setToRedis(REDIS_STORE_ID_KEY, storeId);
      logger.debug(`Replaced storeId with ${storeId}`);
    }
    return storeId;
  } catch (error) {
    logger.error(error, `Error storeIdPreCheck for storeId ${storeId}`);
    throw error;
  }
}

async function refreshAccessToken(decodedRedisPayload, currentUtcTime) {
  const response = authService.refreshAccessToken(decodedRedisPayload, currentUtcTime);
  return response;
}

async function verifyUserPayloadAndRefreshToken(payload) {
  try {
    let userId = payload.userId;
    let storeId = payload.storeId;
    let refreshToken = payload.refreshToken;
    let userPayloadFromRedis = await RedisUtil.getFromRedis(refreshToken);
    if (!userPayloadFromRedis) {
      throw new Error('Session Expired');
    } else {
      logger.info(`userPayload exists ${JSON.stringify(userPayloadFromRedis)}`);
      let decodedRedisPayload = decode(userPayloadFromRedis);
      logger.debug(`DecodedRedisPayload ${JSON.stringify(decodedRedisPayload)}`);
      if (decodedRedisPayload && decodedRedisPayload.storeId === storeId && decodedRedisPayload.userId === userId) {
        let currentUtcTime = parseInt(moment.utc().format().toString().slice(0, -3));
        let result = await refreshAccessToken(decodedRedisPayload, currentUtcTime);
        return result;
      } else {
        throw new Error('Session Expired');
      }
    }
  } catch (error) {
    throw error;
  }
}

async function validateJWT(authorizationToken) {
  try {
    logger.debug('Validating JWT');
    let decodedAuthPayload = await authService.validateJWT(authorizationToken);
    return decodedAuthPayload;
  } catch (err) {
    logger.error(`${JSON.stringify(err)}`);
    if (err.name === 'TokenExpiredError') {
      throw new Error('TokenExpiredError');
    } else {
      throw new Error('Unauthorized');
    }
  }
}

async function verifyAgeOfToken(timeStamp) {
  try {
    logger.debug('Verifying ageOfToken');
    let utcValue = moment.utc().valueOf().toString();
    let currentUtcTime = parseInt(utcValue.slice(0, -3));
    let ageOfToken = currentUtcTime - parseInt(timeStamp);
    if (ageOfToken <= ACCESS_TOKEN_EXPIRY) {
      return true;
    }
    logger.debug('Launch token is expired');
    return false;
  } catch (error) {
    logger.error(error, 'Error verifying ageOfToken');
    throw error;
  }
}

async function userIdExists(storeId, firstName, lastName, userType) {
  logger.info(`Checking if user ${firstName} ${lastName} with userType ${userType} exists for store ${storeId}`);
  const userIdExists = await userCoordinator.userIdExists(storeId, firstName, lastName, userType);
  logger.info(`userIdExists:-> ${userIdExists} store:-> ${storeId}`);
  return userIdExists;
}

export {
  authenticate,
  authenticateRemoteUser,
  decryptPayload,
  getAuthenticatedPayload,
  getRefreshToken,
  getAccessToken,
  generateJWT,
  getJWTForRemoteUser,
  isTokenValid,
  signJWT,
  storeIdPreCheck,
  refreshAccessToken,
  verifyUserPayloadAndRefreshToken,
  validateJWT,
  verifyAgeOfToken,
  userIdExists,
  getRemoteAccessRefreshToken,
};
