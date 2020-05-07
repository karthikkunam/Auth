async function validateEnvironment(environment) {
  try {
    logger.debug(`Validating environment ${environment}`);
    let isValidEnvironment = false;
    const allowedEnvironments = {
      prod: true,
      dev: true,
      qa: true,
      uat: true,
      local: true,
    };
    if (allowedEnvironments[environment]) {
      isValidEnvironment = true;
      logger.debug('isValidEnvironment:', isValidEnvironment);
    }
    return isValidEnvironment;
  } catch (error) {
    logger.error(error, 'Error validating environment');
    throw error;
  }
}

async function validateLaunchToken(token) {
  try {
    let isLaunchTokenValid = true;
    let launchToken = 'c1d1a5cd-56e8-4e51-b381-eede370006a8';
    if (process.env.ENVIRONMENT === 'prod' && token !== launchToken) {
      isLaunchTokenValid = false;
      logger.debug('Invalid launchToken:', isLaunchTokenValid);
    }
    return isLaunchTokenValid;
  } catch (error) {
    logger.error(error, `Error validating launchToken ${token}`);
    throw error;
  }
}

async function validateUserId(userId) {
  try {
    let isUserIdValid = true;
    if (process.env.ENVIRONMENT === 'prod' && userId === '40') {
      isUserIdValid = false;
      logger.debug('Invalid userId' + userId);
      logger.debug('isUserIdValid:', isUserIdValid);
    }
    return isUserIdValid;
  } catch (error) {
    logger.error(error, `Error validating userId ${userId}`);
    throw error;
  }
}

async function validateLoginCredentials(firstName, lastName, username, storeId, userId, password, feature) {
  try {
    logger.info(`Validating user ${firstName} ${lastName} with userId ${userId} for store ${storeId} feature ${feature}`);
    if (!firstName || !lastName || !username || !storeId || !userId || !password) {
      throw new Error('Required attributes: firstName, lastName, username, storeId, userId, password');
    }
    if (isNaN(userId)) {
      throw new Error(`userId is missing or invalid`);
    }
    if (isNaN(password)) {
      throw new Error(`password is missing or invalid`);
    }
    logger.info(`Validated user ${firstName} ${lastName} with userId ${userId} for store ${storeId}`);
    return true;
  } catch (error) {
    logger.error(error, `Error validating user ${firstName} ${lastName} attributes`);
    throw error;
  }
}

export { validateEnvironment, validateLaunchToken, validateUserId, validateLoginCredentials };
