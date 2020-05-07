import jwt from 'jsonwebtoken';
import * as randomize from 'randomatic';
import { SIGN_OPTIONS } from '../util/constants/auth';
import { BaseService } from './base';
import { secretsManager } from '../util/secretsManager/index';
import * as moment from 'moment';
import { AuthUtil } from '../util/auth';
import { BFF_SERVICE } from '../util/constants/auth';

class AuthService extends BaseService {
  _checkBffConnection() {
    return new Promise(async (resolve, reject) => {
      let url = '/healthcheck';
      try {
        let response = await this.httpGet(BFF_SERVICE, url);
        if (response === true) {
          logger.debug('BFF Connection Successful');
          resolve();
        } else {
          logger.debug('BFF Connection Failed');
          reject();
        }
      } catch (err) {
        logger.error(err, 'Error checking BFF connection');
        reject(err);
      }
    });
  }

  refreshAccessToken(incoming, randomToken) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`Incoming in service.refreshAccessToken: ${JSON.stringify(incoming)}`);
        let response = this.generateToken(incoming, randomToken, false);
        if (response) {
          logger.debug('Refreshed access token');
          resolve(response);
        } else {
          logger.debug('Failed to refresh access token');
          reject({ message: 'UnAuthorized' });
        }
      } catch (err) {
        logger.error(err, 'Error refreshing access token');
        reject({ message: 'UnAuthorized' });
      }
    });
  }

  async generateToken(payload, refreshToken, generateRefreshToken) {
    try {
      let lr = payload;
      if (lr.password) {
        delete lr['password'];
      }
      logger.debug(`Generating token from payload ${JSON.stringify(lr)}`);

      let response = await this.signJWT(lr, generateRefreshToken, refreshToken);
      logger.debug('Token generation successful');
      return response;
    } catch (error) {
      logger.error(error, `Error generating token, ERROR: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  validateJWT(authorizationToken) {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug('Verifying JWT');
        let publicKey = await secretsManager.getPublicKey();
        let decodedAuthPayload = jwt.verify(authorizationToken, publicKey, SIGN_OPTIONS);
        logger.debug('Finished verifying JWT');
        resolve(decodedAuthPayload);
      } catch (err) {
        logger.error(err, 'Error validating JWT');
        reject(err);
      }
    });
  }

  signJWT(result, needRefreshToken, randomtoken) {
    return new Promise(async (resolve, reject) => {
      try {
        let response;
        logger.debug('Attempting to sign JWT');
        if (result) {
          let payload = result;
          let privateKey = await secretsManager.getPrivateKey();
          let token = jwt.sign(payload, privateKey, SIGN_OPTIONS);
          if (needRefreshToken) {
            let refreshToken = randomtoken || randomize('0', 20);
            logger.debug(`payload : ${JSON.stringify(payload)}`);
            response = {
              userId: payload.userId,
              storeId: payload.storeId,
              token: token,
              refreshToken: refreshToken,
            };
          } else {
            response = token;
          }
        }
        logger.debug('Finished signing JWT');
        resolve(response);
      } catch (error) {
        logger.error(error, 'Error signing JWT');
        reject(error);
      }
    });
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

  async buildPayload(decryptedPayload, userData, storeProfile) {
    try {
      let payloadObject = decryptedPayload;
      logger.info(`Building payload for user ${userData.userId}`);
      delete payloadObject['timeZone'];
      payloadObject.store = storeProfile;
      payloadObject.store.user = {
        userId: userData.userId,
        fullName: (userData.firstName ? userData.firstName : '') + ' ' + (userData.lastName ? userData.lastName : ''),
        roles: userData.roles,
      };
      logger.info(`Built payload for user ${userData.userId}`);
      return Promise.resolve(payloadObject);
    } catch (err) {
      logger.error(JSON.stringify(err), `Error building payload for user ${userData.userId}`);
      return Promise.reject({ message: 'Error building payload' });
    }
  }

  async generateTokenFromPayload(storeId, userId, deviceType, password, feature) {
    try {
      if (!password) {
        password = '711290';
      }
      if (!deviceType) {
        deviceType = 'ISP';
      }
      if (!feature) {
        feature = 'home';
      }
      logger.debug(`Generating token for store ${storeId}, user ${userId}, deviceType ${deviceType} feature ${feature}`);
      let tokenString =
        '{"userId":REPLACE_USERID, "storeId":"REPLACE_STOREID", "deviceType":"REPLACE_DEVICETYPE", "dateTime":"REPLACE_UTC_DATETIME", "timeStamp":"REPLACE_TIMESTAMP", "timezone":"Utc"}';
      let utcValue = moment.utc().valueOf().toString();
      let currentUtcTime = parseInt(utcValue.slice(0, -3));

      //$2a$10$h6W81x27qztRkraqTLoWK.NFBnhOxiyv2SMf/jSfIFyU5bIksdzNC
      //{"dateTime":"2019-09-04T20:37:44Z","deviceType":"ISP","feature":"ordering","ip":"192.168.137.29","password":"711291",,"storeId":"36312","timeStamp":"1567629464","timeZone":"GMT","userId":"41"}

      let token = {
        userId: parseInt(userId),
        storeId: `${storeId}`,
        deviceType: `${deviceType.toUpperCase()}`,
        feature: 'ordering',
        ip: '192.168.137.29',
        password: `${password}`,
        dateTime: `${moment.utc().format()}`,
        timeStamp: `${currentUtcTime}`,
        timeZone: 'Utc',
      };
      tokenString = tokenString
        .replace('REPLACE_USERID', userId)
        .replace('REPLACE_STOREID', storeId)
        .replace('REPLACE_UTC_DATETIME', moment.utc().format())
        .replace('REPLACE_TIMESTAMP', currentUtcTime);
      tokenString = JSON.stringify(token);
      let encryptedString = await AuthUtil.encrypt(tokenString);
      return Promise.resolve(encryptedString);
    } catch (error) {
      logger.error(`${JSON.stringify(error)}, Error generating token from payload for store ${storeId} user ${userId} deviceType ${deviceType}`);
    }
  }
}

let authService = new AuthService();

export { authService };
