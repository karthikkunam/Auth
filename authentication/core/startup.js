/**
 * Module dependencies.
 */
require('dotenv').config();
/**
 * Environmental configs setup.
 */
const { app } = require('../server');
const { _initializeLogger } = require('../logger');
const { authService } = require('../services/auth');

function _launchServer(app) {
  try {
    const PORT = process.env.PORT || 3110;
    app.listen(PORT, (err) => {
      if (err) throw err;
      logger.info(`Auth server started on: ${PORT}`);
    });
    return Promise.resolve();
  } catch (ex) {
    logger.error(ex.stack);
    process.exit(1);
  }
}

async function start() {
  try {
    await _initializeLogger();
    // await authService._checkBffConnection();
    await _launchServer(app);
    return Promise.resolve();
  } catch (error) {
    console.error(error);
    console.error(error.message);
    return Promise.reject(error);
  }
}

start();

export { start };
