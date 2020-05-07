const express = require('express');
const remoteRouter = express.Router();
const remoteValidator = require('../validators/remote');
const remoteCoordinator = require('../coordinators/remote');
const { authService } = require('../services/auth');
const { Logger } = require('../logger');
const { REMOTE_USER_DEVICE_TYPE, SUPPORT_USER_TYPE } = require('../util/constants/remote');
const attributeValidator = require('../validators/attribute');
const authCoordinator = require('../coordinators/auth');

// Remote route to any feature
remoteRouter.post('/:storeId/', async (req, res) => {
  try {
    const { storeId } = req.params;
    let { username, firstName, lastName, email, userId, userType, feature } = req.body;
    let storeUserId;
    if (!userId) {
      storeUserId = await remoteCoordinator.getStoreUserIdByStoreIdAndRemoteUserId(storeId, username);
      logger.debug(`storeUserId: ${storeUserId}`);
    }
    if (!userId && !storeUserId) {
      logger.debug('userId does not exist');
      res.status(401).send({ message: 'UserId not found' });
    }
    const deviceType = REMOTE_USER_DEVICE_TYPE;
    userId = storeUserId;
    const isAttributesValid = await attributeValidator.validateAttributes(storeId, firstName, lastName, username, email, userType, feature);
    if (!isAttributesValid) {
      logger.error('Error required attributes: storeId, firstName, lastName, username, email, userType');
      res.status(401).send({ message: 'Unauthorized' });
    }
    logger.info(`Authenticating user with firstName ${firstName} lastName ${lastName} ${username} email ${email}`);
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
    res.status(200).send(accessId);
  } catch (error) {
    logger.error(error, `Error authenticating user ${req.body.firstName}, ${req.body.lastName} to access`);
    res.status(500).send({ message: 'Internal Server Error' });
  } finally {
    Logger.flushLogs();
  }
});

remoteRouter.get('/auth/remote/login/:uuid', async (req, res) => {
  try {
    logger.info(`Authenticating uuid ${req.params.uuid} for remote user`);
    const { uuid } = req.params;
    if (!uuid) {
      res.status(401).send({ message: 'Unauthorized' });
    }
    const jwt = await remoteCoordinator.getJWT(uuid);
    logger.info('Authenticated remote user');
    res.status(200).send(jwt);
  } catch (error) {
    logger.error(`Error authenticating remote user with uuid ${req.params.uuid}`, error);
  } finally {
    Logger.flushLogs();
  }
});

remoteRouter.post('/users/login', async (req, res) => {
  try {
    const { firstName, lastName, username, email, storeId, userId, password, userType, feature } = req.body;
    const isValid = await remoteValidator.validateLoginCredentials(firstName, lastName, username, storeId, userId, password, feature);
    if (!isValid) {
      res.status(401).send({ message: 'Unauthorized' });
    }
    const response = await remoteCoordinator.login(firstName, lastName, username, email, storeId, userId, password, feature, userType);
    if (!response) {
      res.status(401).send({ message: 'Unauthorized' });
    } else {
      res.status(200).send(response);
    }
  } catch (error) {
    logger.error(
      error,
      `Error authenticating user ${req.body.firstName} ${req.body.lastName} with userId ${req.body.userId} for store ${req.body.userId}`
    );
    res.status(500).send({ message: 'Internal Server Error' });
  } finally {
    Logger.flushLogs();
  }
});

remoteRouter.post('/:username/:deviceType', async (req, res) => {
  try {
    const { username, deviceType } = req.params;
    const { firstName, lastName, isSupportUser, email, adGroups } = req.body;
    logger.debug(`Remote user ${username} ${deviceType}`);
    if (deviceType !== REMOTE_USER_DEVICE_TYPE) {
      logger.error(`Error: Incorrect deviceType for user ${deviceType}`);
      res.status(401).send({ message: 'Unauthorized' });
    }
    if (!firstName || !lastName || !username || !email) {
      logger.error(`Error: Required attributes firstname, lastname, username, email`);
      res.status(401).send({ message: 'Unauthorized' });
    }
    if (!isSupportUser && !adGroups) {
      logger.error(`No active groups found for user ${username}`);
      res.status(401).send({ message: 'Unauthorized' });
    }
    logger.info(`Authenticating user firstName: ${firstName} lastName: ${lastName} username: ${username} email: ${email} deviceType: ${deviceType}`);
    const remoteUserAccessToken = await remoteCoordinator.authenticateRemoteUser(
      firstName,
      lastName,
      username,
      email,
      deviceType,
      isSupportUser,
      adGroups
    );
    logger.info(`Generated remoteUserAccessToken for remote user ${username} deviceType ${deviceType}`);
    res.status(200).send(remoteUserAccessToken);
  } catch (error) {
    logger.error(error, `Error generating token for remote user ${req.params.username} ${req.params.deviceType}`);
    res.status(500).send({ message: 'Server Error' });
  } finally {
    Logger.flushLogs();
  }
});

remoteRouter.post('/auth/refresh/token', async (req, res) => {
  try {
    logger.info('Trying to refresh token');
    let inputData = req.body;
    const refreshedToken = await remoteCoordinator.refreshAccessToken(inputData);
    res.status(200).send(refreshedToken);
  } catch (error) {
    logger.error(error, 'Error refreshing token');
    res.status(500).send({ message: 'Server Error Refreshing Token' });
  } finally {
    Logger.flushLogs();
  }
});

remoteRouter.post('/stores/:storeId/:username/', async (req, res) => {
  try {
    const { storeId, username } = req.params;
    const { isSupportUser } = req.body;
    logger.info(`Checking if store ${storeId} is allowed for user ${username}`);
    if (!isSupportUser) {
      res.status(401).send({ message: 'Unauthorized' });
    }
    const storeInfo = await remoteCoordinator.getStoreInfo(username, storeId, SUPPORT_USER_TYPE);
    logger.info(`StoreInfo ${JSON.stringify(storeInfo)}`);
    if (!storeInfo || !storeInfo.storeId) {
      res.status(401).send({ message: 'Unauthorized' });
    } else {
      res.status(200).send(storeInfo);
    }
  } catch (error) {
    logger.error(error, `Error checking if ${req.params.storeId} is allowed store`);
    res.status(500).send({
      message: `Server Error Checking store ${req.params.storeId} is allowed for user ${req.params.username}`,
    });
  } finally {
    Logger.flushLogs();
  }
});

remoteRouter.get('/:deviceType/launch/:storeid/:userid/:password?', async (req, res) => {
  // StoreInfo
  const storeInfo = {
    storeId: req.params.storeid,
    userId: req.params.userid,
    deviceType: req.params.deviceType,
  };
  logger.info('storeInfo', storeInfo);

  try {
    logger.info('Launching store');

    // Check if the environment is one of the allowed environments
    logger.info(`Environment: ${process.env.ENVIRONMENT}`);
    const isEnvironmentAllowed = await remoteValidator.validateEnvironment(process.env.ENVIRONMENT);
    if (!isEnvironmentAllowed) {
      logger.info(`Request not allowed in this ENVIRONMENT: ${process.env.ENVIRONMENT}, for ${JSON.stringify(storeInfo)}`);
      res.status(401).send({ message: 'Unauthorized' });
    }

    // Check if storeId exists
    let storeId;
    if (req.params) {
      storeId = req.params.storeid;
      if (!storeId) {
        logger.info(`Failed to get storeId from request for store ${JSON.stringify(storeInfo)}`);
        res.status(401).send({ message: 'Unauthorized' });
      }
    }

    // Fetch store information
    logger.info(`Getting store with storeId ${storeId}, clientIp: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);

    // launchToken for testing prod environment
    let reqLaunchToken = req.query.launchtoken;

    // Validate launchToken
    const isLaunchTokenValid = await remoteValidator.validateLaunchToken(reqLaunchToken);
    if (!isLaunchTokenValid) {
      logger.info('Invalid launchToken');
      res.status(401).send({ message: 'Unauthorized' });
    }

    // if no userId, Defaults userId to 99
    let userId = req.params.userid ? req.params.userid : 99;

    // Check if the userId is allowed in current environment
    const isUserIdValid = await remoteValidator.validateUserId(userId);
    if (!isUserIdValid) {
      logger.info('Invalid userId');
      res.status(401).send({ message: 'Unauthorized' + JSON.stringify(err) });
    }

    // Set default storeInfo
    let password = req.params.password ? req.params.password : '711290';
    let deviceType = req.params.deviceType ? req.params.deviceType.toUpperCase() : 'ISP';

    // TODO Move this call to remoteCoordinator --> orderCoordinator --> orderService
    // Check if ordering is enabled for store
    let isOrderingEnabled = false;
    const allowedStore = await authService.getStoreProfile(storeId);
    if (allowedStore && allowedStore.features && allowedStore.features.boss) {
      isOrderingEnabled = allowedStore.features.boss.isOrderingEnabled;
    }

    // If ordering is disabled in production environment
    if (!isOrderingEnabled && process.env.ENVIRONMENT === 'prod') {
      logger.info(`Ordering not enabled for store ${storeId}`);
      res.status(401).send({ message: 'Unauthorized' });
    }

    // Route to default store if ordering is disabled
    if (!isOrderingEnabled) {
      logger.info('Not an allowed store');
      storeId = '18473';
      password = '711290';
    }

    // Generate Token for remote user
    const encryptedString = await remoteCoordinator.generateTokenFromPayload(storeId, userId, deviceType, password);
    logger.info('Sending encrypted token');
    res.send(encryptedString);
  } catch (error) {
    logger.error(error);
    logger.error(error, `Error generating token ${JSON.stringify(storeInfo)}`);
    res.status(500).send({
      message: 'Error authenticating remote user and generating token',
    });
  } finally {
    Logger.flushLogs();
  }
});

export { remoteRouter };
