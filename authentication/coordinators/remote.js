const moment = require('moment');
const { RedisUtil } = require('../util/redis');
const { authService } = require('../services/auth');
const randomize = require('randomatic');
const authCoordinator = require('./auth');
const storeCoordinator = require('./store');
const userCoordinator = require('./user');
const remoteFactory = require('../factories/remote');
const { FRANCHISE_OWNER_GROUP, STOR_MANAGER_GROUP } = require('../util/constants/remote');
const { encode, decode } = require('../util/string');

async function authenticateRemoteUser(firstName, lastName, username, email, deviceType, isSupportUser, adGroups) {
  let remoteUserPayload;
  logger.info(
    `Authenticating remote user firstName: ${firstName} lastName: ${lastName} username: ${username} email: ${email} deviceType: ${deviceType} ${JSON.stringify(
      adGroups
    )}`
  );
  const refreshToken = await authCoordinator.getRemoteAccessRefreshToken(username);
  logger.info(`isSupportUser: ${isSupportUser}`);
  if (isSupportUser) {
    remoteUserPayload = await remoteFactory.buildSupportUser(firstName, lastName, username, email, deviceType);
  }
  if (!isSupportUser) {
    const allowedStores = await getAllowedStores(adGroups);
    remoteUserPayload = await remoteFactory.buildUser(firstName, lastName, username, email, deviceType, allowedStores);
  }
  const remoteUserToken = await generateJWT(remoteUserPayload, refreshToken);
  let encodedPayload = encode(JSON.stringify(remoteUserToken));
  await RedisUtil.setToRedis(refreshToken, encodedPayload);
  logger.debug(`remoteUserToken ${JSON.stringify(remoteUserToken)}`);
  return remoteUserToken;
}

async function generateJWT(payload, refreshToken) {
  try {
    logger.debug(`Generating JWT payload ${JSON.stringify(payload)}`);
    if (payload.password) {
      delete payload['password'];
    }
    const JWT = await authCoordinator.signJWT(payload);
    let newRefreshToken = refreshToken || randomize('0', 20);
    const updatedPayload = {
      token: JWT,
      refreshToken: newRefreshToken,
    };
    logger.debug(`Generating token from payload ${JSON.stringify(updatedPayload)}`);
    logger.info('Token generation successful');
    return updatedPayload;
  } catch (error) {
    logger.error(error, `Error generating token, ERROR: ${JSON.stringify(error)}`);
    throw error;
  }
}

async function getJWT(uuid) {
  const jwt = await authCoordinator.getJWTForRemoteUser(uuid);
  return jwt;
}

async function getStoreInfoForActiveDirectoryGroup(storeId, activeDirectoryGroup) {
  try {
    let storeInfo;
    logger.info(`Getting storeInfo for store ${storeId}`);
    const storeInfoArray = await storeCoordinator.getStoreInfo(storeId);
    storeInfo = storeInfoArray[0];
    storeInfo.userType = activeDirectoryGroup;
    // ENABALE THIS ONCE ACESS TO S3
    // const allowedFeatures = process.env.ENVIRONMENT === 'local' ? { isOrderingEnabled: true } : await isAllowedStore(storeInfo.storeId);
    const allowedFeatures = { isOrderingEnabled: true };
    storeInfo.allowedFeatures = {
      isOrderingEnabled: allowedFeatures.isOrderingEnabled,
    };
    logger.info(`Received storeInfo ${JSON.stringify(storeInfo)} for store ${storeId}`);
    if (storeInfo && storeInfo.storeId) {
      return storeInfo;
    }
    return null;
  } catch (error) {
    logger.error(error, `Error getting storeInfo for store ${storeId}`);
    throw error;
  }
}

async function getAllowedStores(adGroups) {
  try {
    logger.info(`Getting allowedStores for user from active directory groups ${JSON.stringify(adGroups)}`);
    let allowedStores = [];
    let storeManagerStores;
    let franchiseOwnerStores;
    const storeManagerGroup = adGroups['storeManagerGroup'];
    const franchiseOwnerGroup = adGroups['franchiseOwnerGroup'];
    if (storeManagerGroup && storeManagerGroup.length > 0) {
      logger.info(`Getting store info for storeManagerStores ${JSON.stringify(storeManagerGroup)}`);
      storeManagerStores = await Promise.all(storeManagerGroup.map((storeId) => getStoreInfoForActiveDirectoryGroup(storeId, STOR_MANAGER_GROUP)));
      allowedStores = [...storeManagerStores];
    }
    if (franchiseOwnerGroup && franchiseOwnerGroup.length > 0) {
      logger.info(`Getting store info for franchiseOwnerStores ${JSON.stringify(franchiseOwnerGroup)}`);
      franchiseOwnerStores = await Promise.all(
        franchiseOwnerGroup.map((storeId) => getStoreInfoForActiveDirectoryGroup(storeId, FRANCHISE_OWNER_GROUP))
      );
      allowedStores = [...franchiseOwnerStores];
    }
    const filteredAllowedStores = allowedStores.filter((store) => {
      if (store !== null) {
        return store;
      }
    });
    const sortedStores = filteredAllowedStores.sort((store1, store2) => {
      if (store1.storeId < store2.storeId) {
        return -1;
      } else {
        return 1;
      }
    });
    logger.info(`Got allowedStores ${JSON.stringify(sortedStores)} from active directory groups ${JSON.stringify(adGroups)}`);
    return sortedStores;
  } catch (error) {
    logger.error(error, `Error getting allowedStores from active directory groups ${JSON.stringify(adGroups)}`);
    throw error;
  }
}

async function generateTokenFromPayload(storeId, userId, deviceType, password) {
  logger.debug(`Generating token for store ${storeId} user ${userId} deviceType ${deviceType}`);
  const encryptedPayload = await authService.generateTokenFromPayload(storeId, userId, deviceType, password);
  return encryptedPayload;
}

async function getStoreInfo(username, storeId, userType) {
  try {
    logger.info(`Getting storeInfo for user ${username} store ${storeId} userType ${userType}`);
    const storeInfo = await getStoreInfoForActiveDirectoryGroup(storeId, userType);
    logger.info(`Retrieved storeInfo for store ${storeId} username ${username} userType ${userType}`);
    return storeInfo;
  } catch (error) {
    logger.error(`Error getting store info for user ${username} store ${storeId} userType ${userType}`);
    throw error;
  }
}

async function getStoreUserIdByStoreIdAndRemoteUserId(storeId, remoteUserId) {
  try {
    logger.info(`Getting storeUserId by remoteUserId ${remoteUserId} for store ${storeId}`);
    const storeUserId = await userCoordinator.getStoreUserIdByStoreIdAndRemoteUserId(storeId, remoteUserId);
    logger.info(`Got storeUserId ${storeUserId} for remoteUserId ${remoteUserId} store ${storeId}`);
    return storeUserId;
  } catch (error) {
    logger.error(error, `Error getting storeUserId by remoteUserId ${remoteUserId} for store ${storeId}`);
    throw error;
  }
}

async function isAllowedStore(storeId) {
  try {
    logger.info(`Checking if store ${storeId} is allowed`);
    const isAllowed = await storeCoordinator.isAllowedStore(storeId);
    logger.info(`isAllowedStore: ${JSON.stringify(isAllowed)}`);
    return isAllowed;
  } catch (error) {
    logger.error(error, `Error checking if store ${storeId} is allowed`);
    throw error;
  }
}

async function login(firstName, lastName, username, email, storeId, userId, password, feature, userType) {
  try {
    logger.info(`Logging in user ${firstName} ${lastName} with userId ${userId} for store ${storeId} feature ${feature} userType ${userType}`);
    const isLoginSuccess = await userCoordinator.loginUser(storeId, userId, password, feature);
    logger.info(`isLoginSuccess: ${isLoginSuccess}`);
    if (!isLoginSuccess) {
      return false;
    }
    if (isLoginSuccess) {
      await userCoordinator.createRemoteUser(firstName, lastName, storeId, userId, username, email, userType);
      const userPayload = {
        storeId,
        firstName,
        lastName,
        username,
        email,
        userType,
        feature,
        userId,
      };
      const accessId = await authCoordinator.authenticateRemoteUser(userPayload);
      return accessId;
    }
  } catch (error) {
    logger.error(error, `Error logging in user ${firstName} lastName ${lastName} with userId ${userId} for store ${storeId}`);
    throw error;
  }
}

async function refreshAccessToken(payload) {
  try {
    logger.info('refresh token called');
    let username = payload.username;
    // TODO Check for userId
    let refreshToken = payload.refreshToken;
    let userPayloadFromRedis = await RedisUtil.getFromRedis(refreshToken);
    if (!userPayloadFromRedis) {
      throw new Error('Session Expired');
    }
    // TODO Add username check after decoded
    let decodedRedisPayload = decode(userPayloadFromRedis);
    let currentUtcTime = parseInt(moment.utc().format().toString().slice(0, -3));
    let result = await authCoordinator.refreshAccessToken(decodedRedisPayload, currentUtcTime);
    return result;
  } catch (error) {
    logger.error(error, `Error refreshing token payload: ${JSON.stringify(payload)}`);
    throw error;
  }
}

export {
  authenticateRemoteUser,
  generateJWT,
  getJWT,
  getAllowedStores,
  generateTokenFromPayload,
  getStoreInfo,
  getStoreUserIdByStoreIdAndRemoteUserId,
  isAllowedStore,
  login,
  refreshAccessToken,
};
