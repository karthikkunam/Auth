import { BFF_SERVICE } from '../util/constants/auth';

const { BaseService } = require('./base');
const { filterAllowedStores } = require('@7eleven/7boss-store-check');
const { FEATURES } = require('../util/constants/remote');

class StoreService extends BaseService {
  async getStoreInfo(storeId) {
    let url = `/services/stores/${storeId}/profiles`;
    try {
      logger.debug(`Getting store Info for store ${storeId}`);
      let response = await this.httpGet(BFF_SERVICE, url);
      if (response && !response.code && response.body) {
        logger.debug(`Fetching storeInfo ${JSON.stringify(response.body)} successful for store ${storeId}`);
        return response.body;
      } else {
        logger.debug(`Failed to get storeInfo for store ${storeId}`);
        throw new Error(`Store Info not available for store ${storeId}`);
      }
    } catch (err) {
      logger.error(JSON.stringify(err), `Error getting store settings for store ${storeId}`);
      throw err;
    }
  }

  getStoreProfile(storeId) {
    return new Promise(async (resolve, reject) => {
      logger.debug(`Getting storeProfile for store ${storeId}`);
      let storeProfile = null;
      if (!storeId) {
        logger.debug(`StoreProfile not found for store ${storeId}`);
        resolve(storeProfile);
      }
      let store = {};
      try {
        let storeInfo = await this.getStoreSettings(storeId);
        if (!storeInfo) {
          logger.debug(`Failed to get storeInfo for store ${storeId}`);
        }
        let storeFeatures = await this.getStoreFeatures(storeId);
        if (!storeFeatures) {
          logger.debug(`Failed to get storeFeatures for store ${storeId}`);
        }

        if (storeInfo && storeFeatures) {
          store = storeInfo;
          store.features = storeFeatures;
          logger.debug(`Fetching storeProfile successful for store ${storeId}`);
          resolve(store);
        } else {
          logger.debug(`Failed to get storeInfo for store ${storeId}`);
          reject({ code: 404, message: 'Store Info not found!' });
        }
      } catch (err) {
        logger.error(err, `Error getting storeProfile for store ${storeId}`);
        reject({
          code: 500,
          message: 'Server Error while retrieving store settings/features',
        });
      }
    });
  }

  getStoreSettings(storeId) {
    return new Promise(async (resolve, reject) => {
      let url = '/services/stores/' + storeId;
      try {
        logger.debug(`Getting store settings for store ${storeId}`);
        let response = await this.httpGet(BFF_SERVICE, url);
        if (response && !response.code && response.data) {
          logger.debug(`Fetching storeSettings successful for store ${storeId}`);
          resolve(response.data);
        } else {
          logger.debug(`Failed to get StoreSettings for store ${storeId}`);
          reject({ code: 404, message: 'Store settings not available!' });
        }
      } catch (err) {
        logger.error(JSON.stringify(err), `Error getting store settings for store ${storeId}`);
        reject({
          code: 500,
          message: 'Server Error while retrieving store settings.',
        });
      }
    });
  }

  getStoreFeatures(storeId) {
    return new Promise(async (resolve, reject) => {
      let url = '/services/stores/' + storeId + '/features';
      try {
        logger.debug(`Getting store features for store ${storeId}`);
        let response = await this.httpGet(BFF_SERVICE, url);
        if (response && !response.code && response.data) {
          logger.debug(`Fetching storeFeatures successful for store ${storeId}`);
          resolve(response.data);
        } else {
          logger.debug(`Failed to get storeFeatures for store ${storeId}`);
          reject({ code: 404, message: 'Store features not available' });
        }
      } catch (err) {
        logger.error(JSON.stringify(err), `Error getting storeFeatures for store ${storeId}`);
        reject({
          code: 500,
          message: 'Server Error while retrieving store features',
        });
      }
    });
  }

  async isAllowedStore(storeId) {
    try {
      let isAllowedStore = {
        isOrderingEnabled: false,
        isPromoEnabled: false,
        isInventoryEnabled: false,
      };
      logger.info(`Checking if store ${storeId} is allowed`);
      const [
        orderingAllowedStores,
        promoAllowedStores,
        // inventoryAllowedStores
      ] = await Promise.all([
        filterAllowedStores([storeId], FEATURES.ORDERING),
        filterAllowedStores([storeId], FEATURES.PROMOTIONS),
        // filterAllowedStores([storeId], FEATURES.INVENTORY),
      ]);
      logger.debug(`orderingAllowedStores: ${JSON.stringify(orderingAllowedStores)}`);
      logger.debug(`promoAllowedStores: ${JSON.stringify(promoAllowedStores)}`);
      // logger.debug(`inventoryAllowedStores: ${JSON.stringify(inventoryAllowedStores)}`);
      if (orderingAllowedStores.length > 0 && orderingAllowedStores.includes(storeId)) {
        isAllowedStore.isOrderingEnabled = true;
      }
      if (promoAllowedStores.length > 0 && promoAllowedStores.includes(storeId)) {
        isAllowedStore.isPromoEnabled = true;
      }
      // if (inventoryAllowedStores.length > 0 && inventoryAllowedStores.includes(storeId)) {
      //     isAllowedStore.isInventoryEnabled = true
      // }
      logger.debug(`isAllowedStore: ${JSON.stringify(isAllowedStore)}`);
      logger.info('Done checking allowed store');
      return isAllowedStore;
    } catch (error) {
      logger.error(error, `Error checking if store ${storeId} is allowed`);
      throw error;
    }
  }
}

const storeService = new StoreService();

export { storeService };
