const express = require('express');
const router = express.Router();
const authCoordinator = require('../coordinators/auth');
const { REMOTE_USER_DEVICE_TYPE } = require('../util/constants/remote');
const { AUTHORIZATION } = require('../util/constants/auth');
const { Logger } = require('../logger');

router.get('/', async (req, res) => {
  logger.info('Authenticating user for ISP or 7MD');
  try {
    const encryptedData = req.headers[AUTHORIZATION];
    const accessInfo = await authCoordinator.getAuthenticatedPayload(encryptedData);
    logger.debug(`AccessID: ${JSON.stringify(accessInfo)}`);
    res.status(200).send(accessInfo);
  } catch (error) {
    logger.error(error, 'Error authenticating ISP or 7MD user');
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get('/auth/validate', async (req, res) => {
  try {
    const authorizationToken = req.headers[AUTHORIZATION];
    if (!authorizationToken) {
      logger.error('No authorization token found');
      res.status(401).send({ message: 'Unauthorized' });
    }
    logger.info('Validating if token is valid');
    const decodedAuthPayload = await authCoordinator.validateJWT(authorizationToken);
    res.status(200).send(decodedAuthPayload);
  } catch (error) {
    logger.error(error, 'Error validating token');
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get('/auth/:id/:deviceType?', async (req, res) => {
  try {
    if (!req.params.id) {
      logger.error(`uuid not found`);
      res.status(401).send({ message: 'Unauthorized' });
    }
    logger.info(`Authenticating uuid ${req.params.id}`);
    const accessId = req.params.id;
    const accessToken = await authCoordinator.getAccessToken(accessId);
    if (!accessToken) {
      res.status(401).send({ message: 'No token found' });
    }
    logger.info(`Authenticated user with id ${accessId}`);
    logger.debug(`AccessToken: ${JSON.stringify(accessToken)}`);
    res.status(200).send(accessToken);
  } catch (error) {
    logger.error(error, `Error authenticating uuid ${req.params.id}`);
    res.status(500).send({ message: 'Internal Server Error' });
  } finally {
    Logger.flushLogs();
  }
});

router.post('/auth/refresh/token', async (req, res) => {
  try {
    logger.info('Trying to refresh token for user');
    let inputData = req.body;
    const refreshedToken = await authCoordinator.verifyUserPayloadAndRefreshToken(inputData);
    logger.info('Refreshed token successfully for user');
    res.status(200).send(refreshedToken);
  } catch (error) {
    logger.error(error, 'Error refreshing token for user');
    res.status(500).send({ message: 'Server Error Refreshing Token' });
  } finally {
    Logger.flushLogs();
  }
});

export { router };
