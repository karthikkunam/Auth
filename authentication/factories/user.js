async function buildUser(storeId, userId, password) {
  try {
    logger.info(`Building user with userId ${userId} for store ${storeId}`);
    const user = {
      storeId,
      userId,
      password,
    };
    logger.debug(`Built user ${JSON.stringify(user)}`);
    logger.info(`Built user with userId ${userId} for store ${storeId} successfully`);
    return user;
  } catch (error) {
    logger.error(error, `Error building user with userId ${userId} for store ${storeId}`);
    throw error;
  }
}

async function buildRemoteUser(firstName, lastName, storeId, userId, remoteUserId, email, userType) {
  try {
    logger.info(`Building remote user with userId ${userId} for store ${storeId} remoteUserId ${remoteUserId}`);
    const remoteUser = {
      firstName,
      lastName,
      storeId,
      userId,
      email,
      userType,
    };
    remoteUser.username = remoteUserId;
    logger.debug(`Built remoteUser ${JSON.stringify(remoteUser)}`);
    logger.info(`Built user with userId ${userId} for store ${storeId} remoteUserId ${remoteUserId} successfully`);
    return remoteUser;
  } catch (error) {
    logger.error(error, `Error building user with userId ${userId} for store ${storeId} remoteUserId ${remoteUserId}`);
    throw error;
  }
}

export { buildUser, buildRemoteUser };
