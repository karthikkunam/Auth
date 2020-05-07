const { REMOTE_ACCESS_SUPPORT_USER_ID } = require('../util/constants/remote');

async function buildUser(firstName, lastName, username, email, deviceType, allowedStores) {
  try {
    logger.info(
      `Building user with firstName: ${firstName} lastName: ${lastName} username:${username} email: ${email} deviceType:${deviceType} allowedStores:${JSON.stringify(
        allowedStores
      )}`
    );
    let user;
    const isSupportUser = false;
    user = {
      firstName,
      lastName,
      username,
      email,
      deviceType,
      isSupportUser,
      allowedStores,
    };
    logger.info(`RemoteAccessUser ${JSON.stringify(user)}`);
    return user;
  } catch (error) {
    logger.error(error, `Error building user with ${username}, deviceType ${deviceType} adGroups ${JSON.stringify(allowedStores)}`);
    throw error;
  }
}

async function buildRefreshPayload(storeId, userId, username) {
  logger.info(`Building refreshPayload for store ${storeId} userId ${userId} username ${username}`);
  const refreshPayload = { storeId, userId, username };
  logger.info(`RefreshPayload: ${JSON.stringify(refreshPayload)}`);
  return refreshPayload;
}

async function buildSupportUser(firstName, lastName, username, email, deviceType) {
  try {
    logger.info(
      `Building support user with firstName: ${firstName} lastName: ${lastName} username:${username} email: ${email} deviceType:${deviceType}`
    );
    let user;
    const userId = REMOTE_ACCESS_SUPPORT_USER_ID;
    const allowedStores = [];
    const isSupportUser = true;
    user = {
      firstName,
      lastName,
      username,
      email,
      deviceType,
      isSupportUser,
      allowedStores,
    };
    user.userId = userId;
    logger.info(`RemoteAccessSupportUser ${JSON.stringify(user)}`);
    return user;
  } catch (error) {
    logger.error(
      error,
      `Error building support user with firstName: ${firstName} lastName: ${lastName} username:${username} email: ${email} deviceType:${deviceType}`
    );
    throw error;
  }
}

function buildStoreProfile(storeInfo) {
  const { storeId, streetAddress, city, state, zip } = storeInfo;
  const storeProfile = { storeId, streetAddress, city, state, zip };
  return storeProfile;
}

export { buildRefreshPayload, buildStoreProfile, buildSupportUser, buildUser };
