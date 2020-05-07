const uuidv4 = require('uuidv4').default;

function getUniqueId() {
  logger.debug('Generating UUID');
  const UUID = uuidv4();
  logger.debug(`UUID: ${UUID}`);
  return UUID;
}

module.exports = {
  getUniqueId,
};
