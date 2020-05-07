const { Logger, setLoggerToFlushDecoratorLogs } = require('@7eleven/7boss-logger');
const metaData = {
  team: 'ris2.0',
  cache: false,
};
const SET_DEFAULT_LOGGER = process.env.ENVIRONMENT === 'local';
const loggerConfig = {
  environment: process.env.ENVIRONMENT,
  kinesisStream: process.env.logsKinesisStream,
  writerRoleArn: process.env.writerRoleArn,
  applicationName: process.env.ApplicationName,
  originator: process.env.originator,
  setDefaultLogger: SET_DEFAULT_LOGGER,
  logLevel: null,
  logConfigLevels: null,
  debugLogs: false,
  consoleLogs: false,
};

const _initializeLogger = async () => {
  try {
    Logger.initialize(
      loggerConfig.environment,
      loggerConfig.kinesisStream,
      loggerConfig.writerRoleArn,
      loggerConfig.applicationName,
      loggerConfig.originator,
      loggerConfig.setDefaultLogger,
      metaData,
      loggerConfig.logLevel,
      loggerConfig.logConfigLevels,
      loggerConfig.debugLogs,
      loggerConfig.consoleLogs
    );
    global.logger = Logger.getLoggerInstance(loggerConfig.applicationName);
    // setLoggerToFlushDecoratorLogs(logger);
    return Promise.resolve();
  } catch (error) {
    log.error(error, 'Error initializing logger');
    return Promise.reject(error);
  }
};

module.exports = {
  _initializeLogger,
  Logger,
};
