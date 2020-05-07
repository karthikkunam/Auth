const randomize = require('randomatic');
const authCoordinator = require('./auth');
const { storeService } = require('../services/store');

async function getStoreInfo(storeId) {
  try {
    logger.info(`Getting storeInfo for store ${storeId}`);
    const storeInfo = await storeService.getStoreInfo(storeId);
    logger.info(`Successfully retrieved storeInfo for store ${storeId}`);
    return storeInfo;
  } catch (error) {
    logger.error(error, `Error getting storeInfo for store ${storeId}`);
    throw error;
  }
}

async function getStoreProfile(storeId) {
  try {
    logger.info(`Getting store profile for store ${storeId}`);
    const storeProfile = await storeService.getStoreProfile(storeId);
    logger.info(`Retrieved storeProfile ${JSON.stringify(storeProfile)} successfully for store ${storeId}`);
    return storeProfile;
  } catch (error) {
    logger.error(`Error getting storeProfile for store ${storeId}`);
    throw error;
  }
}

async function isAllowedStore(storeId) {
  try {
    logger.info(`Checking if store ${storeId} is allowed`);
    const allowedStore = await storeService.isAllowedStore(storeId);
    const allowedFeatures = { isPromoEnabled: allowedStore.isPromoEnabled };
    logger.info(`isAllowedStore: ${JSON.stringify(allowedFeatures)}`);
    return allowedFeatures;
  } catch (error) {
    logger.error(error, `Error checking if store ${storeId} is allowed`);
    throw error;
  }
}

export { getStoreInfo, getStoreProfile, isAllowedStore };
