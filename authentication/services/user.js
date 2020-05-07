const { BaseService } = require('./base');
const { STORE_PROFILE_SERVICE, BFF_SERVICE, STORE_USERS_SERVICE } = require('../util/constants/auth');

class UserService extends BaseService {
  async authenticate(user) {
    try {
      let url = '/stores/users/authenticate';
      logger.info(`Authenticating user ${user.userId} for store ${user.storeId}`);
      const response = await this.httpPost(STORE_PROFILE_SERVICE, url, user);
      logger.debug(`Response ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error(error, `Error authenticating user with userId ${user.userId} for store ${user.storeId}`);
      throw error;
    }
  }

  async createRemoteUser(remoteUser) {
    try {
      logger.info(`Creating remote user ${JSON.stringify(remoteUser)}`);
      const storeId = remoteUser.storeId;
      let url = `/${process.env.STORE_USERS_API_VERSION}/stores/${storeId}/remoteusers/user`;
      const response = await this.httpPost(STORE_USERS_SERVICE, url, remoteUser);
      logger.debug(`Response from createRemoteUser ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      logger.error(error, `Error creating remote user ${JSON.stringify(remoteUser)}`);
      throw error;
    }
  }

  async findremoteUserByStoreIdAndRemoteUserId(storeId, remoteUserId) {
    try {
      logger.info(`Finding storeUserId by remoteUserId ${remoteUserId} storeId ${storeId}`);
      let url = `/${process.env.STORE_USERS_API_VERSION}/stores/${storeId}/remoteusers/${remoteUserId}`;
      const response = await this.httpGet(STORE_USERS_SERVICE, url);
      const data = response.message;
      logger.info(`Got remoteUser ${JSON.stringify(data)} by remoteUserId ${remoteUserId} storeId ${storeId}`);
      return data;
    } catch (error) {
      logger.error(`Error finding storeUserId by remoteUserId ${remoteUserId} storeId ${storeId}`);
      throw error;
    }
  }

  async getAvailableRolesForStore(storeId) {
    let url = `/services/stores/${storeId}/users`;
    try {
      logger.info(`Getting available roles for store ${storeId}`);
      let response = await this.httpGet(BFF_SERVICE, url);
      if (response && !response.code && response.data) {
        logger.debug(`Fetching available roles successful for store ${storeId}`);
        const message = response.data.message;
        const availableRolesForStore = message.data;
        logger.debug(`AvailableRoles: ${JSON.stringify(availableRolesForStore)}`);
        return availableRolesForStore;
      } else {
        logger.debug(`Failed to get storeInfo for store ${storeId}`);
        throw new Error('Roles not available!');
      }
    } catch (error) {
      logger.error(error, `Error getting available roles for store ${storeId}`);
      throw error;
    }
  }

  getUserData(userId, storeId) {
    return new Promise(async (resolve, reject) => {
      let userData = null;
      if (!storeId || !userId) {
        resolve(userData);
      }
      logger.debug(`Getting user data with userId ${userId} and store ${storeId}`);
      let url = '/services/stores/' + storeId + '/users/' + userId;
      try {
        let response = await this.httpGet(BFF_SERVICE, url);
        logger.debug(`http response code for User Request : ${JSON.stringify(response.data)}`);
        if (response && !response.code && response.data) {
          userData = response.data;
        }
        logger.debug(`Got userData ${JSON.stringify(userData)}`);
        resolve(userData);
      } catch (err) {
        logger.error(err, 'Error getting user data');
        reject({ code: 404, message: JSON.parse(err.messaage) });
      }
    });
  }
}

const userService = new UserService();

export { userService };
