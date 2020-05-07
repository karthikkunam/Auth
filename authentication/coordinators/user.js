const { userService } = require('../services/user');
const userFactory = require('../factories/user');
const { FRANCHISE_OWNER_GROUP } = require('../util/constants/remote');

async function createRemoteUser(firstName, lastName, storeId, userId, remoteUserId, email, userType) {
  try {
    logger.info(`Creating remote user for store ${storeId} with remoteUserId ${remoteUserId} userId ${userId} userType ${userType}`);
    const remoteUser = await userFactory.buildRemoteUser(firstName, lastName, storeId, userId, remoteUserId, email, userType);
    const response = await userService.createRemoteUser(remoteUser);
    logger.info(`Created remote user successfully for store ${storeId} with remoteUserId ${remoteUserId} userId ${userId} userType ${userType}`);
    return response;
  } catch (error) {
    logger.error(error, `Error creating remote user for store ${storeId} with remoteUserId ${remoteUserId} userId ${userId} userType ${userType}`);
    throw error;
  }
}

async function getUserData(userId, storeId) {
  logger.info(`Getting userData for userId ${userId} storeId ${storeId}`);
  const userData = await userService.getUserData(userId, storeId);
  logger.info(`Got userData ${JSON.stringify(userData)}`);
  return userData;
}

async function getUserId(storeId, firstName, lastName, userType) {
  try {
    logger.info(`Getting userId for ${firstName} ${lastName} with type ${userType}`);
    const availableUserRolesForStore = await userService.getAvailableRolesForStore(storeId);
    const filteredStoreUserRoles = availableUserRolesForStore.filter((userRole) => {
      if (userRole.roles.includes(userType)) {
        return userRole;
      }
    });
    const filteredUserRole = filteredStoreUserRoles[0];
    logger.info(`filteredUserRole:-> ${JSON.stringify(filteredUserRole)}`);
    logger.info(`Checking if multiple userRoles exist for userType ${userType}`);
    if (userType === FRANCHISE_OWNER_GROUP && filteredStoreUserRoles.length > 1) {
      logger.error(`Error: Multiple Franchise Owners exist for the store ${storeId} for user ${firstName} ${lastName} with userType ${userType}`);
      throw new Error(`Error: Multiple Franchise Owners exist for the store ${storeId} for user ${firstName} ${lastName} with userType ${userType}`);
    }
    await verifyUserInformation(firstName, lastName, userType, filteredUserRole);
    const userId = filteredUserRole.userId;
    logger.info(`Got userId ${userId} for user ${firstName} ${lastName} with userType ${userType}`);
    return userId;
  } catch (error) {
    logger.error(error, `Error getting userId for ${firstName} ${lastName} with userType ${userType}`);
    throw error;
  }
}

async function getStoreUserIdByStoreIdAndRemoteUserId(storeId, remoteUserId) {
  try {
    logger.info(`Getting storeUserId for remoteUserId ${remoteUserId} storeId ${storeId}`);
    const remoteUser = await userService.findremoteUserByStoreIdAndRemoteUserId(storeId, remoteUserId);
    const storeUserId = remoteUser.userId;
    logger.info(`Got storeUserId ${storeUserId} remoteUserId ${remoteUserId} storeId ${storeId}`);
    return storeUserId;
  } catch (error) {
    logger.error(error, `Error getting storeUserId by remoteUserId ${remoteUserId} storeId ${storeId}`);
    throw error;
  }
}

async function verifyUserInformation(firstName, lastName, userType, filteredUserRole) {
  try {
    logger.info(
      `Verifying user information with firstName ${firstName} lastName ${lastName} userType ${userType} filteredUserRole ${JSON.stringify(
        filteredUserRole
      )}`
    );
    if (firstName !== filteredUserRole.firstName) {
      logger.error(`Error: firstName ${firstName} does not match with ${filteredUserRole.firstName}`);
      throw new Error(`Error: firstName ${firstName} does not match with ${filteredUserRole.firstName}`);
    }
    if (lastName !== filteredUserRole.lastName) {
      logger.error(`Error: lastName ${lastName} does not match with ${filteredUserRole.lastName}`);
      throw new Error(`Error: lastName ${lastName} does not match with ${filteredUserRole.lastName}`);
    }
    if (filteredUserRole.roles.includes(userType) === false) {
      logger.error(`Error: userType ${userType} does not match with ${filteredUserRole.userType}`);
      throw new Error(`Error: userType ${userType} does not match with ${filteredUserRole.userType}`);
    }
    const isUserVerified = true;
    return isUserVerified;
  } catch (error) {
    logger.error(
      `Error verifying user information firstName ${firstName} lastName ${lastName} userType ${userType} filteredUserRole ${JSON.stringify(
        filteredUserRole
      )}`
    );
    throw error;
  }
}

async function loginUser(storeId, userId, password) {
  try {
    logger.info(`Trying to log in user ${userId} for store ${storeId}`);
    const user = await userFactory.buildUser(storeId, userId, password);
    const response = await userService.authenticate(user);
    logger.debug(`Response for user logging in with userId ${userId} storeId ${storeId} --> ${JSON.stringify(response)}`);
    logger.info(`Response from storeProfile API: ${JSON.stringify(response)}`);
    let userObject;
    if (response) {
      userObject = { ...response };
    }
    if (userObject && userObject.storeId && userObject.userId && userObject.assignedRoles) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error(error, `Error logging in user with userId ${userId} for store ${storeId}`);
    logger.debug(error, `Error logging in user with userId ${userId} password ${password} for store ${storeId}`);
    throw error;
  }
}

async function userIdExists(storeId, firstName, lastName, userType) {
  return false;
}

module.exports = {
  createRemoteUser,
  getUserData,
  getUserId,
  getStoreUserIdByStoreIdAndRemoteUserId,
  userIdExists,
  loginUser,
};
